import Anthropic from "@anthropic-ai/sdk";
import {
  anthropicClient,
  describeEmptyResponse,
  STRUCTURED_OUTPUT_CONFIG,
} from "@/lib/ai/anthropicClient";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import type { GoalMealSlot } from "@/lib/ai/goal-matched-recipe";
import { CLAUDE_MEAL_PLAN_MODEL } from "@/lib/ai/client";
import { stepsMentionUnlistedIngredients } from "@/lib/recipes/stepIngredientAlignment";
import { validateRecipeCoherence } from "@/lib/recipes/recipeCoherence";

export type GeneratedFullRecipe = {
  title: string;
  description: string;
  servings: number;
  total_time_mins: number;
  ingredients: RecipeIngredientInput[];
  steps: string[];
};

function requireApiKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY;
  return key?.trim() || null;
}

function firstTextBlock(content: Anthropic.Messages.ContentBlock[]): string | null {
  for (const block of content) {
    if (block.type === "text") return block.text;
  }
  return null;
}

function parseJsonFromAssistant(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  return JSON.parse(raw) as unknown;
}

function normalizeIngredient(raw: unknown): RecipeIngredientInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = String(o.name ?? "").trim();
  const quantity = Number(o.quantity);
  const unit = String(o.unit ?? "g").trim();
  if (!name || !Number.isFinite(quantity) || quantity <= 0) return null;
  return { name, quantity, unit };
}

export function validateGeneratedFullRecipe(
  parsed: unknown,
  bannedTerms: string[],
): GeneratedFullRecipe | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const title = String(o.title ?? "").trim();
  const description = String(o.description ?? "").trim();
  const steps = Array.isArray(o.steps)
    ? o.steps.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const ingredients = (Array.isArray(o.ingredients) ? o.ingredients : [])
    .map(normalizeIngredient)
    .filter((x): x is RecipeIngredientInput => x != null);
  if (!title || steps.length < 1 || ingredients.length < 1) return null;
  if (stepsMentionUnlistedIngredients(steps, ingredients)) return null;
  if (!validateRecipeCoherence({ name: title, steps, ingredients }).ok) return null;

  const blob = `${title} ${description} ${ingredients.map((i) => i.name).join(" ")}`.toLowerCase();
  for (const term of bannedTerms) {
    if (term && blob.includes(term.toLowerCase())) return null;
  }

  return {
    title,
    description,
    servings: Math.max(1, Math.round(Number(o.servings) || 1)),
    total_time_mins: Math.max(5, Math.round(Number(o.total_time_mins) || 20)),
    ingredients,
    steps,
  };
}

/**
 * LLM step: turn assembled ingredients into a cookable recipe with adjusted quantities.
 * Returns null when API unavailable or JSON invalid (caller falls back to templates).
 */
export async function generateFullRecipeFromIngredients(input: {
  mealSlot: GoalMealSlot;
  seedIngredients: RecipeIngredientInput[];
  targetCalories: number;
  dietaryConstraintsLine: string;
  bannedIngredientTerms: string[];
}): Promise<GeneratedFullRecipe | null> {
  const key = requireApiKey();
  if (!key) return null;

  try {
    const anthropic = anthropicClient(key);
    const model = process.env.ANTHROPIC_RECIPE_MODEL?.trim() || CLAUDE_MEAL_PLAN_MODEL;

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4000,
      output_config: STRUCTURED_OUTPUT_CONFIG,
      system: `You write cookable UK home recipes. Return ONLY valid JSON, no markdown fences.`,
      messages: [
        {
          role: "user",
          content: `Write a cookable ${input.mealSlot} recipe using these ingredients at approximately these quantities:
${JSON.stringify(input.seedIngredients, null, 2)}

Target ~${input.targetCalories} kcal per serving.
${input.dietaryConstraintsLine ? `Dietary constraints (MUST obey): ${input.dietaryConstraintsLine}` : ""}
${
  input.mealSlot === "snack"
    ? `
This is a SNACK — it must be a recognisable dish someone would actually eat (e.g. "Berry yoghurt pot", "Peanut butter banana oats", "Cottage cheese & strawberry cup").
Do NOT title it as a list of raw ingredients (never "Chickpeas & Carrots with Oats").
Combine ingredients into one snack with 3–5 clear method steps (mix, layer, toast, etc.).`
    : ""
}

Rules:
- You may make small quantity adjustments and add only basic pantry seasonings (salt, pepper, herbs, a sensible amount of cooking oil).
- Do NOT add new major ingredients beyond the list + basic seasonings/oil.
- Every method step must ONLY reference ingredients in your returned ingredients list (if there are no eggs, do not mention eggs).
- EVERY ingredient in your list must appear in at least one method step — no orphan ingredients.
- The title must match what the method actually makes (if it says Toast, the method must toast bread).
- Method must be real steps a home cook can follow.
- Return ONLY this JSON:
{"title":"...","description":"one line","servings":1,"total_time_mins":25,"ingredients":[{"name":"...","quantity":130,"unit":"g"}],"steps":["step 1","step 2"]}`,
        },
      ],
    });

    const text = firstTextBlock(response.content);
    if (!text) {
      console.warn("[generateFullRecipeFromIngredients]", describeEmptyResponse(response));
      return null;
    }
    const parsed = parseJsonFromAssistant(text);
    return validateGeneratedFullRecipe(parsed, input.bannedIngredientTerms);
  } catch (err) {
    console.error("[generateFullRecipeFromIngredients]", err);
    return null;
  }
}

/**
 * Last-resort bulk fill: invent a fresh recipe when template rotation hits dedupe limits.
 */
export async function generateFullRecipeForSlot(input: {
  mealSlot: GoalMealSlot;
  targetCalories: number;
  dietaryConstraintsLine: string;
  proteinAxis?: string;
  bannedTitles: string[];
  variantSeed: number;
}): Promise<GeneratedFullRecipe | null> {
  const key = requireApiKey();
  if (!key) return null;

  const avoid = input.bannedTitles
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 40);
  const axisHint =
    input.proteinAxis && !["plant", "vegetarian", "vegan"].includes(input.proteinAxis)
      ? `Protein style: ${input.proteinAxis} (e.g. ${input.proteinAxis === "fish" ? "salmon, tuna, prawns" : "chicken, turkey, beef mince"}).`
      : input.mealSlot === "breakfast" || input.mealSlot === "snack"
        ? "Use eggs, dairy, yoghurt, oats, fruit, nuts — not steak or chicken mains at breakfast."
        : "";

  try {
    const anthropic = anthropicClient(key);
    const model = process.env.ANTHROPIC_RECIPE_MODEL?.trim() || CLAUDE_MEAL_PLAN_MODEL;

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4000,
      output_config: STRUCTURED_OUTPUT_CONFIG,
      system: `You write varied, cookable UK home recipes. Return ONLY valid JSON, no markdown fences.`,
      messages: [
        {
          role: "user",
          content: `Invent ONE new ${input.mealSlot} recipe (~${input.targetCalories} kcal per serving).
${input.dietaryConstraintsLine ? `Dietary constraints (MUST obey): ${input.dietaryConstraintsLine}` : ""}
${axisHint}
Variety seed: ${input.variantSeed} — pick a different dish style than typical chicken-and-rice.

${
  input.mealSlot === "snack"
    ? `This is a SNACK (80–300 kcal): a named dish like "Berry yoghurt pot" or "Peanut butter banana toast" — not a list of raw ingredients.`
    : ""
}

Do NOT reuse or closely paraphrase these existing recipe titles:
${avoid.length ? avoid.map((t) => `- ${t}`).join("\n") : "(none yet)"}

Use UK ingredient names that appear in home cooking (CoFID-style: chicken breast, greek yogurt, oats, brown rice, broccoli, etc.).
Every ingredient must appear in the method; the title must match the dish the steps describe.
Return ONLY this JSON:
{"title":"...","description":"one line","servings":1,"total_time_mins":25,"ingredients":[{"name":"...","quantity":130,"unit":"g"}],"steps":["step 1","step 2"]}`,
        },
      ],
    });

    const text = firstTextBlock(response.content);
    if (!text) {
      console.warn("[generateFullRecipeForSlot]", describeEmptyResponse(response));
      return null;
    }
    const parsed = parseJsonFromAssistant(text);
    return validateGeneratedFullRecipe(parsed, []);
  } catch (err) {
    console.error("[generateFullRecipeForSlot]", err);
    return null;
  }
}
