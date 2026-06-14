import { parsePublisherNutritionFromRecipeNode } from "@/lib/nutrition/publisherNutrition";

const node = {
  nutrition: {
    "@type": "NutritionInformation",
    calories: "429 calories",
    fatContent: "20 grams fat",
    saturatedFatContent: "4 grams saturated fat",
    carbohydrateContent: "31 grams carbohydrates",
    sugarContent: "4 grams sugar",
    fiberContent: "6 grams fiber",
    proteinContent: "28 grams protein",
    sodiumContent: "0.55 milligram of sodium",
  },
};

const parsed = parsePublisherNutritionFromRecipeNode(node);
if (!parsed) throw new Error("expected publisher nutrition");
if (parsed.calories !== 429) throw new Error(`calories: ${parsed.calories}`);
if (parsed.protein_g !== 28) throw new Error(`protein: ${parsed.protein_g}`);
if (parsed.carbs_g !== 31) throw new Error(`carbs: ${parsed.carbs_g}`);
if (parsed.fat_g !== 20) throw new Error(`fat: ${parsed.fat_g}`);
if (parsed.fibre_g !== 6) throw new Error(`fibre: ${parsed.fibre_g}`);

console.log("publisherNutrition.test.ts: all assertions passed");
