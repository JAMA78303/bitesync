import { extractRecipeFromHtml } from "@/lib/recipes/extractRecipeFromHtml";
import { parsedIngredientsToInputs, scaleParsedIngredients } from "@/lib/recipes/parseIngredient";
import { calculateRecipeNutrition } from "@/lib/nutrition/calculate";
import { ingredientGrams } from "@/lib/nutrition/convert";
import { lookupNutrition } from "@/lib/nutrition/lookup";

async function main() {
  const url = "https://www.bbcgoodfood.com/recipes/easy-chicken-fajitas";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BiteSync/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const extracted = extractRecipeFromHtml(html);

  console.log("Name:", extracted.name);
  console.log("Detected servings:", extracted.detectedServings);
  console.log("Ingredient lines:", extracted.ingredients.length);
  for (const ing of extracted.ingredients) {
    console.log(
      `  • ${ing.rawText ?? ing.name} → qty ${ing.quantity} ${ing.unit ?? ""} | grams ${ing.grams ?? "?"}`,
    );
  }

  const fullInputs = parsedIngredientsToInputs(extracted.ingredients);
  const full = calculateRecipeNutrition(fullInputs);
  const fullKcal = Math.round(full.calories);

  console.log("\nPer-ingredient (local DB):");
  for (const ing of fullInputs) {
    const nutrition = lookupNutrition(ing.name);
    const grams = ingredientGrams(ing.quantity, ing.unit, nutrition, ing.name);
    const kcal =
      nutrition && grams ? Math.round((nutrition.per_100g.calories * grams) / 100) : 0;
    console.log(
      `  ${ing.quantity} ${ing.unit} ${ing.name} → ${grams ?? "?"}g → ${kcal} kcal ${nutrition ? "" : "(NO MATCH)"}`,
    );
  }

  const scale = 1 / Math.max(1, extracted.detectedServings);
  const scaledInputs = parsedIngredientsToInputs(scaleParsedIngredients(extracted.ingredients, scale));
  const one = calculateRecipeNutrition(scaledInputs);
  const oneKcal = Math.round(one.calories);

  console.log("\n--- DIAGNOSIS ---");
  console.log(`Full recipe (${extracted.detectedServings} servings): ${fullKcal} kcal`);
  console.log(`Per serving (scaled ${scale.toFixed(3)}): ${oneKcal} kcal`);
  console.log(`one × servings = ${oneKcal * extracted.detectedServings} kcal`);
  console.log(`Expected ~1920 full / ~480 per serving`);
  console.log(`Coverage: ${full.coverage_pct}%`);

  if (fullKcal > 0) {
    const ratio = oneKcal / (fullKcal / extracted.detectedServings);
    console.log(`Scaling linearity ratio: ${ratio.toFixed(2)} (expect ~1.0)`);
  }

  const expectedPerServing = 480;
  const withinMargin =
    oneKcal >= expectedPerServing * 0.8 && oneKcal <= expectedPerServing * 1.2;
  if (fullKcal < 1400) {
    console.log("VERDICT: STEP 2B PARSING BUG — full recipe total too low before/at scaling");
  } else if (!withinMargin && oneKcal < 400) {
    console.log("VERDICT: STEP 2B PARSING BUG — per-serving far below 480");
  } else if (Math.abs(oneKcal - fullKcal / extracted.detectedServings) < 5 && withinMargin) {
    console.log("VERDICT: PASS — parsing and scaling within ~20% of 480 kcal/serving");
  } else if (Math.abs(oneKcal - fullKcal / extracted.detectedServings) < 5) {
    console.log("VERDICT: SCALING OK — totals computed; check per-serving vs BBC variance");
  } else {
    console.log("VERDICT: STEP 2A SCALING BUG — per-serving does not match full recipe ÷ servings");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
