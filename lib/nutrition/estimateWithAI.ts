import Anthropic from "@anthropic-ai/sdk";

export interface EstimatedNutrition {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  estimated: true;
}

export async function estimateNutritionWithAI(
  ingredientName: string,
  quantity: number,
  unit: string,
): Promise<EstimatedNutrition | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = new Anthropic();

    const prompt = `You are a precise nutrition database. Estimate the macronutrients for the following ingredient.

Ingredient: ${quantity} ${unit} ${ingredientName}

Respond with ONLY a JSON object, no explanation, no markdown:
{
  "kcal": <number>,
  "protein": <grams as number>,
  "carbs": <grams as number>,
  "fat": <grams as number>,
  "fibre": <grams as number>
}

Base your estimate on standard UK nutrition data. If the unit is 'each' or 'piece', use a typical weight for that item. Be conservative and accurate — do not guess wildly.`;

    const model =
      process.env.ANTHROPIC_NUTRITION_MODEL?.trim() ||
      process.env.ANTHROPIC_MODEL?.trim() ||
      "claude-sonnet-4-20250514";

    const response = await client.messages.create({
      model,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const parsed = JSON.parse(text) as Record<string, unknown>;

    return {
      kcal: Number(parsed.kcal) || 0,
      protein: Number(parsed.protein) || 0,
      carbs: Number(parsed.carbs) || 0,
      fat: Number(parsed.fat) || 0,
      fibre: Number(parsed.fibre) || 0,
      estimated: true,
    };
  } catch {
    return null;
  }
}
