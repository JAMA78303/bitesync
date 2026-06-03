import {
  ingredientNamesMatch,
  parseBulkIngredientInput,
  scoreIngredientOverlap,
} from "@/lib/matching/ingredient-overlap";
import { suggestMealsFromAvailableIngredients } from "@/lib/matching/suggest-meals";

function assertMatch(a: string, b: string, note: string) {
  if (!ingredientNamesMatch(a, b)) {
    throw new Error(`Expected match: "${a}" ↔ "${b}" (${note})`);
  }
}

function assertNoMatch(a: string, b: string, note: string) {
  if (ingredientNamesMatch(a, b)) {
    throw new Error(`Expected no match: "${a}" ↔ "${b}" (${note})`);
  }
}

assertMatch("chicken", "chicken breast", "protein variant");
assertMatch("tomato", "tinned tomatoes", "form variant");
assertMatch("eggs", "egg", "plural");
assertNoMatch("chicken", "dark chocolate", "unrelated");

const bulk = parseBulkIngredientInput("chicken, rice, broccoli, eggs");
if (bulk.length !== 4) throw new Error(`bulk parse expected 4, got ${bulk.length}`);

const result = suggestMealsFromAvailableIngredients(
  bulk,
  [
    {
      id: "1",
      name: "Chicken stir fry",
      fits_vegetarian: false,
      fits_vegan: false,
      fits_gluten_free: true,
      ingredients: [
        { name: "chicken breast" },
        { name: "rice" },
        { name: "broccoli" },
        { name: "soy sauce" },
      ],
    },
  ],
  { dietaryPreferences: [] },
);

if (result.matches.length !== 1) throw new Error("expected one ranked match");
if (result.matches[0].matchedCount < 3) {
  throw new Error(`expected ≥3 matched, got ${result.matches[0].matchedCount}`);
}

console.log(
  `OK: overlap scores chicken/breast=${scoreIngredientOverlap("chicken", "chicken breast")}, match=${result.matches[0].overlapLabel}`,
);
