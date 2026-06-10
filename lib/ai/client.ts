import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MEAL_PLAN_MODEL = "claude-sonnet-4-20250514" as const;

export type ClaudeRecipeLibraryItem = {
  id: string;
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
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

export type ClaudeMealPlanResult = {
  plan: ClaudeMealPlanDay[];
  notes?: string;
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
};

function requireApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return key;
}

function getAnthropic(): Anthropic {
  return new Anthropic({ apiKey: requireApiKey() });
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
  return JSON.parse(clean) as unknown;
}

/**
 * Claude-backed weekly (or partial-week) meal plan using only the user’s recipe IDs.
 */
export async function generateMealPlan(params: GenerateMealPlanParams): Promise<ClaudeMealPlanResult | null> {
  try {
    const anthropic = getAnthropic();
    const snackExtra =
      params.snackCountPerDay >= 2
        ? `Each day must also include "snack_b" (recipe id or null) for the second snack slot.`
        : `Use only one "snack" field per day (no snack_b).`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MEAL_PLAN_MODEL,
      max_tokens: 2000,
      system: `You are a nutrition expert and meal planner for UK users.
You help users plan healthy weekly meals that hit their personal 
nutrition targets using ONLY recipes from their own library.

CRITICAL RULES:
- Only use recipe IDs provided in the user's library
- Never invent or suggest recipes not in the library
- Always respect dietary flags and allergies
- Aim to hit calorie target within ±7% or ±150 kcal per day (whichever is tighter); week average within ±5%
- Add a snack (100–350 kcal) on days where breakfast+lunch+dinner fall below target; leave snack null when already on target
- Maximise protein where possible
- Vary meals across the week
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

MY RECIPE LIBRARY:
${JSON.stringify(
  params.recipes.map((r) => ({
    id: r.id,
    name: r.name,
    calories: r.calories,
    protein_g: r.protein_g,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
  })),
  null,
  2,
)}

MY DAILY TARGETS:
  Calories: ${params.dailyCalorieTarget} kcal
  Protein: ${params.dailyProteinTarget}g

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
      "breakfast": "recipe_id_or_null",
      "lunch": "recipe_id_or_null",
      "dinner": "recipe_id_or_null",
      "snack": "recipe_id_or_null"${params.snackCountPerDay >= 2 ? ',\n      "snack_b": "recipe_id_or_null"' : ""}
    }
  ],
  "notes": "brief explanation"
}

There must be exactly ${params.daysToFill} objects in "plan", with "day" running from 0 to ${params.daysToFill - 1}.
Day 0 = first day in this planning window (e.g. Monday of the chosen span when the app uses Mon–Sun).
Use null if no suitable recipe exists for a slot.
Only use recipe IDs from the library above.`,
        },
      ],
    });

    const text = firstTextBlock(response.content);
    if (!text) return null;
    const parsed = parseJsonFromAssistant(text) as { plan?: ClaudeMealPlanDay[]; notes?: string };
    if (!parsed?.plan || !Array.isArray(parsed.plan)) return null;
    return { plan: parsed.plan, notes: parsed.notes };
  } catch (err) {
    console.error("Claude meal plan generation failed:", err);
    return null;
  }
}

export type SubstitutionIngredientInput = {
  name: string;
  quantity: number;
  unit: string;
  currentPrice: number;
  store: string;
};

export type SubstitutionCanonicalInput = {
  id: string;
  name: string;
  category: string;
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
};

export type SubstitutionStoreProductInput = {
  canonicalItemId: string;
  store: string;
  productName: string;
  currentPrice: number;
  unitPrice: number;
  sizeValue: number;
  sizeUnit: string;
};

export type GenerateSubstitutionsParams = {
  ingredients: SubstitutionIngredientInput[];
  canonicalItems: SubstitutionCanonicalInput[];
  storeProducts: SubstitutionStoreProductInput[];
  dietaryFlags: {
    isVegan: boolean;
    isVegetarian: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
  };
  nutritionTargets: {
    calories: number;
    protein_g: number;
  };
};

export type ClaudeSubstitutionRow = {
  originalItem: string;
  suggestedItem: string;
  suggestedStore: string;
  savingAmount: number;
  reason: string;
  nutritionImpact: string;
  safeForDiet: boolean;
};

export type ClaudeSubstitutionsResult = {
  substitutions: ClaudeSubstitutionRow[];
};

export async function generateSubstitutions(
  params: GenerateSubstitutionsParams,
): Promise<ClaudeSubstitutionsResult | null> {
  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: CLAUDE_MEAL_PLAN_MODEL,
      max_tokens: 1500,
      system: `You are a nutrition-aware grocery optimiser for UK shoppers.
Suggest cheaper product substitutions that:
- Save money without compromising nutrition targets
- Respect all dietary flags and allergies
- Keep macros (especially protein) within 10% of original
- Only suggest items from the provided store products list
- Return ONLY valid JSON, no explanation, no markdown`,

      messages: [
        {
          role: "user",
          content: `Suggest money-saving substitutions for my grocery list.

CURRENT BASKET:
${JSON.stringify(params.ingredients, null, 2)}

AVAILABLE ALTERNATIVES:
${JSON.stringify(params.storeProducts.slice(0, 80), null, 2)}

CANONICAL ITEMS (for reference):
${JSON.stringify(params.canonicalItems.slice(0, 80), null, 2)}

DIETARY REQUIREMENTS:
${JSON.stringify(params.dietaryFlags)}

NUTRITION TARGETS (daily):
  Calories: ${params.nutritionTargets.calories} kcal
  Protein: ${params.nutritionTargets.protein_g}g

Return ONLY this JSON, no other text:
{
  "substitutions": [
    {
      "originalItem": "item name",
      "suggestedItem": "cheaper alternative name",
      "suggestedStore": "store name",
      "savingAmount": 0.00,
      "reason": "why this swap makes sense",
      "nutritionImpact": "minimal impact on protein/macros",
      "safeForDiet": true
    }
  ]
}

Only suggest substitutions where saving > £0.20.
Maximum 5 substitutions.
Never suggest swaps that break dietary requirements.`,
        },
      ],
    });

    const text = firstTextBlock(response.content);
    if (!text) return null;
    const parsed = parseJsonFromAssistant(text) as ClaudeSubstitutionsResult;
    if (!parsed?.substitutions || !Array.isArray(parsed.substitutions)) return null;
    return parsed;
  } catch (err) {
    console.error("Claude substitution generation failed:", err);
    return null;
  }
}

/** @deprecated Prefer `generateMealPlan` / `generateSubstitutions` for structured flows. */
export async function callClaudeJSON<T>(prompt: string): Promise<T> {
  requireApiKey();
  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: CLAUDE_MEAL_PLAN_MODEL,
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });
  const text = firstTextBlock(response.content);
  if (!text) {
    throw new Error("Claude returned no text content");
  }
  return parseJsonFromAssistant(text) as T;
}
