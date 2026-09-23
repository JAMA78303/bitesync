import Anthropic from "@anthropic-ai/sdk";
import {
  anthropicClient,
  describeEmptyResponse,
  STRUCTURED_OUTPUT_CONFIG,
} from "@/lib/ai/anthropicClient";

/**
 * Overridable per call site via ANTHROPIC_RECIPE_MODEL / ANTHROPIC_NUTRITION_MODEL.
 * Note nutrition figures are never taken from the model — it proposes ingredients
 * and prose, and macros are computed from the ingredient database afterwards.
 */
export const CLAUDE_MEAL_PLAN_MODEL = "claude-sonnet-5" as const;

export type ClaudeRecipeLibraryItem = {
  id: string;
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  /** Main ingredient names — lets the model reason about micronutrient coverage. */
  ingredients?: string[];
};

export type ClaudeMealPlanDay = {
  day: number;
  breakfast?: string | null;
  lunch?: string | null;
  dinner?: string | null;
  snack?: string | null;
  /** Second snack slot when `snackCountPerDay` is 2 */
  snack_b?: string | null;
};

export type PlanLlmTelemetry = {
  ms: number;
  model: string;
  stopReason: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
};

export type ClaudeMealPlanResult = {
  plan: ClaudeMealPlanDay[];
  notes?: string;
  telemetry?: PlanLlmTelemetry;
};

export type GenerateMealPlanParams = {
  recipes: ClaudeRecipeLibraryItem[];
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  daysToFill: number;
  mealTypes: string[];
  snackCountPerDay: number;
  dietaryFlags: {
    isVegan: boolean;
    isVegetarian: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
  };
  /** Full sentence from buildDietaryConstraints — inserted before meal suggestions. */
  dietaryConstraintsLine?: string;
  allergies: string[];
  /** Foods rich in the user's under-target micronutrients — prefer recipes containing them. */
  microPriorityFoods?: string[];
};

function requireApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return key;
}

function getAnthropic(): Anthropic {
  return anthropicClient(requireApiKey());
}

function firstTextBlock(content: Anthropic.Messages.ContentBlock[]): string | null {
  for (const block of content) {
    if (block.type === "text") {
      return block.text;
    }
  }
  return null;
}

function parseJsonFromAssistant(raw: string): unknown {
  const clean = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(clean) as unknown;
  } catch {
    // The prompt says "ONLY this JSON", but a model that prefaces it with
    // "Here is the plan:" or appends a note turns a good answer into a throw.
    // Take the outermost object before giving up.
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1)) as unknown;
    throw new Error(`Response was not JSON: "${clean.slice(0, 120)}"`);
  }
}

/**
 * Claude-backed weekly (or partial-week) meal plan using only the user’s recipe IDs.
 *
 * `null` means "the model returned nothing usable" — a soft outcome the caller can
 * fall back from. Call failures (rejected key, no credit, rate limit, outage) throw,
 * so the caller can tell the user *why* it fell back instead of silently swapping in
 * the heuristic planner. Swallowing both as `null` hid a misconfigured deployment.
 */
const PLAN_SLOTS = ["breakfast", "lunch", "dinner", "snack", "snack_b"] as const;

/**
 * Turn the model's short keys back into recipe ids. A value that is already a
 * known id is kept (the model occasionally echoes one); anything else — an
 * invented key, a name, a stray string — becomes null, which the apply step
 * treats as "no suitable recipe" rather than a crash.
 */
export function mapPlanKeysToIds(plan: ClaudeMealPlanDay[], idByKey: Map<string, string>): ClaudeMealPlanDay[] {
  const knownIds = new Set(idByKey.values());
  return plan.map((day) => {
    const out: ClaudeMealPlanDay = { day: day.day };
    for (const slot of PLAN_SLOTS) {
      const v = day[slot];
      if (v == null) {
        if (slot in day) out[slot] = null;
        continue;
      }
      const key = String(v).trim();
      out[slot] = idByKey.get(key) ?? idByKey.get(key.toUpperCase()) ?? (knownIds.has(key) ? key : null);
    }
    return out;
  });
}

export async function generateMealPlan(params: GenerateMealPlanParams): Promise<ClaudeMealPlanResult | null> {
  try {
    const anthropic = getAnthropic();
    const snackExtra =
      params.snackCountPerDay >= 2
        ? `Each day must also include "snack_b" (recipe key or null) for the second snack slot.`
        : `Use only one "snack" field per day (no snack_b).`;

    // Recipes go to the model under short keys and come back the same way.
    // A UUID is ~25 tokens; 35 of them was over 1,000 tokens of hex before the
    // model had written a single meal, and the reply was the slow part of the
    // whole week plan. "R7" is two.
    const idByKey = new Map<string, string>();
    const keyById = new Map<string, string>();
    params.recipes.forEach((r, i) => {
      const key = `R${i + 1}`;
      idByKey.set(key, r.id);
      keyById.set(r.id, key);
    });

    const startedAt = Date.now();
    const response = await anthropic.messages.create(
      {
        model: CLAUDE_MEAL_PLAN_MODEL,
        // This call picks recipe IDs from a list into a fixed JSON shape. It
        // does not need to reason, and every thinking token is latency the
        // user sits through with a spinner. #58 replaced an exhausted budget
        // with a generous one and the call went from failing in ~10s to
        // succeeding in over a minute. Off entirely; the tuner enforces
        // calories and variety afterwards regardless of how the IDs were chosen.
        thinking: { type: "disabled" },
        // Seven days of short keys is ~300 tokens; notes are one sentence.
        max_tokens: 1500,
        system: `You are a nutrition expert and meal planner for UK users.
You help users plan healthy weekly meals that hit their personal 
nutrition targets using ONLY recipes from their own library.

CRITICAL RULES:
- Only use recipe IDs provided in the user's library
- Never invent or suggest recipes not in the library
- Always respect dietary flags and allergies
- Aim to hit calorie target within ±7% or ±150 kcal per day (whichever is tighter); week average within ±5%
- EVERY day must fill EVERY snack slot with a snack-sized recipe (100–350 kcal). Plan mains smaller so snacks fit inside the calorie band — do not return null snacks unless the library has no snack-sized recipes at all
- Maximise protein where possible
- Favour recipes whose ingredients cover the listed micronutrient-priority foods; spread them across the week
- Vary meals across the week: use as many different recipes as the calorie and protein targets allow, and never use one recipe more than twice in the week. Reach for a recipe a second time only when no other recipe in the library fits that slot's calories — measured against the standard planner, this is where an AI week loses ground.
- Return ONLY valid JSON, no explanation, no markdown

MEAL SLOT RULES (mandatory):
- If a recipe NAME contains "breakfast" or "brunch" (any capitalisation), assign it ONLY to the breakfast field for that day — never to lunch, dinner, or snack.
- Never assign plain chicken/turkey/fish mains, curry, pasta dinners, rice bowls, or stir-fries to breakfast unless the recipe name explicitly says breakfast or brunch.
- Prefer typical breakfast foods (oats, eggs, yoghurt, toast, smoothies, fruit bowls) for breakfast; use main-meal recipes (curries, hearty salads, pasta dinners, roasts) for lunch and dinner.
- Do not use null for breakfast if the library contains any recipe suitable for breakfast (including names with "breakfast"/"brunch" or common breakfast ingredients).
- Lunch and dinner should normally be different recipes from breakfast unless the library is very small.

UK NHS Guidelines:
- Safe weight loss: max 0.5kg/week (500 kcal deficit)
- Minimum calories: 1200 kcal/day women, 1500 kcal/day men`,

      messages: [
        {
          role: "user",
          content: `Plan ${params.daysToFill} days of meals using my recipe library.

MY RECIPE LIBRARY (refer to recipes by their "key"):
${JSON.stringify(
  params.recipes.map((r) => ({
    key: keyById.get(r.id),
    name: r.name,
    kcal: r.calories,
    protein_g: r.protein_g,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
    ...(r.ingredients?.length ? { ingredients: r.ingredients } : {}),
  })),
)}

MY DAILY TARGETS:
  Calories: ${params.dailyCalorieTarget} kcal
  Protein: ${params.dailyProteinTarget}g
${
  params.microPriorityFoods?.length
    ? `\nMICRONUTRIENT PRIORITIES:\n  My week is currently low on micronutrients found in: ${params.microPriorityFoods.join(", ")}.\n  Prefer recipes containing these ingredients when calories and protein allow.\n`
    : ""
}

DIETARY REQUIREMENTS:
  Vegan: ${params.dietaryFlags.isVegan}
  Vegetarian: ${params.dietaryFlags.isVegetarian}
  Gluten free: ${params.dietaryFlags.isGlutenFree}
  Dairy free: ${params.dietaryFlags.isDairyFree}
  Allergies: ${params.allergies.join(", ") || "none"}
${params.dietaryConstraintsLine ? `\n${params.dietaryConstraintsLine}\n` : ""}
MEAL TYPES TO FILL: ${params.mealTypes.join(", ")}
SNACK SLOTS PER DAY: ${params.snackCountPerDay}
${snackExtra}

Return ONLY this JSON structure, no other text:
{
  "plan": [
    {
      "day": 0,
      "breakfast": "R3",
      "lunch": "R7",
      "dinner": "R12",
      "snack": "R20"${params.snackCountPerDay >= 2 ? ',\n      "snack_b": "R21"' : ""}
    }
  ],
  "notes": "one short sentence"
}

There must be exactly ${params.daysToFill} objects in "plan", with "day" running from 0 to ${params.daysToFill - 1}.
Day 0 = first day in this planning window (e.g. Monday of the chosen span when the app uses Mon–Sun).
Every slot is a recipe key from the library above (like "R7"), or null if no suitable recipe exists.`,
        },
      ],
      },
      // One attempt. The client default retries a timed-out request, so a
      // slow plan was killed at 45s and tried again — up to 135s of spinner
      // before the heuristic took over. A plan that is slow once is not going
      // to be fast the second time; fall back instead. 60s is the ceiling for
      // one honest attempt, above the ~10–20s a no-thinking call should take.
      // 40s: a short-key reply should take 5–10s; anything past 40 is a stall.
      { timeout: 40_000, maxRetries: 0 },
    );

    // Elapsed and token counts on every call, success or not. #58 shipped a
    // budget change with no way to see what it did to latency; this is that.
    const telemetry: PlanLlmTelemetry = {
      ms: Date.now() - startedAt,
      model: response.model,
      stopReason: response.stop_reason,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    };
    console.log("[generateMealPlan]", telemetry);

    const text = firstTextBlock(response.content);
    if (!text) {
      console.warn("[generateMealPlan]", describeEmptyResponse(response));
      return null;
    }
    let parsed: { plan?: ClaudeMealPlanDay[]; notes?: string };
    try {
      parsed = parseJsonFromAssistant(text) as typeof parsed;
    } catch (err) {
      // The first 500 chars of what the model actually said, in the logs,
      // next to the error — so a parse failure can be read rather than inferred.
      console.error("[generateMealPlan] unparseable response:", JSON.stringify(text.slice(0, 500)));
      throw err;
    }
    if (!parsed?.plan || !Array.isArray(parsed.plan)) {
      console.warn("[generateMealPlan] JSON parsed but carried no plan array; keys:", Object.keys(parsed ?? {}).join(","));
      return null;
    }
    return { plan: mapPlanKeysToIds(parsed.plan, idByKey), notes: parsed.notes, telemetry };
  } catch (err) {
    console.error("Claude meal plan generation failed:", err);
    throw err;
  }
}

/** @deprecated Prefer `generateMealPlan` for structured flows. */
export async function callClaudeJSON<T>(prompt: string): Promise<T> {
  requireApiKey();
  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: CLAUDE_MEAL_PLAN_MODEL,
    max_tokens: 4000,
    output_config: STRUCTURED_OUTPUT_CONFIG,
    messages: [{ role: "user", content: prompt }],
  });
  const text = firstTextBlock(response.content);
  if (!text) {
    throw new Error("Claude returned no text content");
  }
  return parseJsonFromAssistant(text) as T;
}
