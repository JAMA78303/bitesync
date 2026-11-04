import { decodeHtmlEntities } from "@/lib/recipes/extractCaptionText";
import { extractRecipeFromHtml } from "@/lib/recipes/extractRecipeFromHtml";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// Recipe sites (Mealime among them) put HTML-escaped text in their JSON-LD.
const cases: [string, string][] = [
  ["Corn &amp; Feta Salad", "Corn & Feta Salad"],
  ["Caf&#233; latte", "Café latte"],
  ["Mum&#x27;s pie", "Mum's pie"],
  ["&amp;lt;b&amp;gt;", "&lt;b&gt;"],
];
for (const [input, expected] of cases) {
  assert(decodeHtmlEntities(input) === expected, `${input} decodes to ${expected}`);
}

const html = `<script type="application/ld+json">${JSON.stringify({
  "@type": "Recipe",
  name: "Chicken, Feta &amp; Mint",
  recipeIngredient: ["1 cup corn &amp; peas"],
  recipeInstructions: ["Mix."],
})}</script>`;
const recipe = extractRecipeFromHtml(html);
assert(recipe.name === "Chicken, Feta & Mint", "imported names are decoded");

console.log("extractRecipeFromHtml tests passed");
