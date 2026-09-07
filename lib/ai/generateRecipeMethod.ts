import Anthropic from "@anthropic-ai/sdk";
import { anthropicClient } from "@/lib/ai/anthropicClient";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import type { GoalMealSlot } from "@/lib/ai/goal-matched-recipe";
import { CLAUDE_MEAL_PLAN_MODEL } from "@/lib/ai/client";
import { validateRecipeCoherence } from "@/lib/recipes/recipeCoherence";
import { stepsMentionUnlistedIngredients } from "@/lib/recipes/stepIngredientAlignment";

function requireApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return key;
}

function firstTextBlock(content: Anthropic.Messages.ContentBlock[]): string | null {
  for (const block of content) {
    if (block.type === "text") return block.text;
  }
  return null;
}

type MethodResult = {
  description: string;
  steps: string[];
};

function parseJsonFromAssistant(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  return JSON.parse(raw) as unknown;
}

/**
 * LLM fallback: richer intro + method when API key is set.
 * Returns null on failure — caller uses template steps.
 */
export async function generateRecipeMethodWithLLM(
  name: string,
  ingredients: RecipeIngredientInput[],
  mealSlot: GoalMealSlot,
  dietaryLine: string,
): Promise<MethodResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const anthropic = anthropicClient(requireApiKey());
    const model = process.env.ANTHROPIC_RECIPE_MODEL?.trim() || CLAUDE_MEAL_PLAN_MODEL;

    const response = await anthropic.messages.create({
      model,
      max_tokens: 900,
      system: `You write concise UK home-cooking recipes. Return ONLY JSON.`,
      messages: [
        {
          role: "user",
          content: `Write a short intro (1-2 sentences) and 4-6 numbered method steps for this ${mealSlot} recipe.

Name: ${name}
Ingredients:
${ingredients.map((i) => `- ${i.quantity} ${i.unit} ${i.name}`).join("\n")}
${dietaryLine ? `\nDietary: ${dietaryLine}\n` : ""}

Rules:
- EVERY ingredient above must appear in at least one step (with quantity where sensible).
- Do not mention ingredients that are not in the list.
- Steps must match the recipe name (if the name says Toast, toast the bread).

Return ONLY:
{"description":"...","steps":["step1","step2",...]}`,
        },
      ],
    });

    const text = firstTextBlock(response.content);
    if (!text) return null;
    const parsed = parseJsonFromAssistant(text) as MethodResult;
    if (!parsed?.steps?.length || typeof parsed.description !== "string") return null;
    const steps = parsed.steps.map((s) => String(s).trim()).filter(Boolean);
    if (stepsMentionUnlistedIngredients(steps, ingredients)) return null;
    if (!validateRecipeCoherence({ name, steps, ingredients }).ok) return null;
    return {
      description: parsed.description.trim(),
      steps,
    };
  } catch {
    return null;
  }
}
