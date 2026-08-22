import { buildMethodStepsFromIngredients } from "@/lib/recipes/buildMethodSteps";
import { stepsMentionUnlistedIngredients } from "@/lib/recipes/stepIngredientAlignment";

{
  const steps = buildMethodStepsFromIngredients(
    [
      { name: "peanut butter", quantity: 18, unit: "g" },
      { name: "banana", quantity: 100, unit: "g" },
      { name: "oats", quantity: 30, unit: "g" },
    ],
    "snack",
  );
  const joined = steps.join(" ").toLowerCase();
  if (!joined.includes("oats")) throw new Error("expected oats in bowl steps");
  if (!joined.includes("peanut butter")) throw new Error("expected peanut butter in bowl steps");
  if (/\begg/.test(joined)) throw new Error("bowl steps must not mention eggs");
}

{
  const bad = stepsMentionUnlistedIngredients(
    ["Beat the eggs and fold through the oats."],
    [
      { name: "oats", quantity: 30, unit: "g" },
      { name: "banana", quantity: 100, unit: "g" },
    ],
  );
  if (!bad) throw new Error("expected egg mention to be flagged");
}

// Reported filler: "Prepare Almond Milk: season lightly and cook through until
// safe to eat", "Prepare 145g Mushroom and add to the dish before serving", and a
// first step that only said "Gather and weigh ingredients".
{
  const porridge = buildMethodStepsFromIngredients(
    [
      { name: "almond milk", quantity: 110, unit: "ml" },
      { name: "oats", quantity: 30, unit: "g" },
      { name: "raspberries", quantity: 45, unit: "g" },
    ],
    "breakfast",
  );
  const joined = porridge.join(" ").toLowerCase();
  if (/gather and weigh/.test(joined)) throw new Error("no filler 'gather ingredients' step");
  if (/safe to eat/.test(joined)) throw new Error("'until safe to eat' is a warning label, not a recipe");
  if (/season.{0,20}almond milk/.test(joined)) throw new Error("must not season the milk");
  if (!/combine .*oats.*almond milk/.test(joined)) throw new Error("oats + milk should be combined");
}

// A vegetable is cooked, not "prepared and added before serving".
{
  const steps = buildMethodStepsFromIngredients(
    [
      { name: "mushrooms", quantity: 145, unit: "g" },
      { name: "wholemeal bread", quantity: 150, unit: "g" },
      { name: "eggs", quantity: 2, unit: "each" },
      { name: "avocado", quantity: 40, unit: "g" },
    ],
    "breakfast",
  );
  const joined = steps.join(" ").toLowerCase();
  if (/add to the dish before serving/.test(joined)) throw new Error("generic filler step remains");
  if (!/mushrooms and cook until tender/.test(joined)) throw new Error("plural veg should be cooked");
  if (!/slice 40g avocado/.test(joined)) throw new Error("avocado is sliced, not scattered");
}

// White fish had no entry in the protein list, so a cod dinner got no cooking step.
{
  const steps = buildMethodStepsFromIngredients(
    [
      { name: "cod", quantity: 150, unit: "g" },
      { name: "potato", quantity: 460, unit: "g" },
      { name: "carrots", quantity: 90, unit: "g" },
    ],
    "dinner",
  );
  const joined = steps.join(" ").toLowerCase();
  if (!/cod/.test(steps[0]!.toLowerCase())) throw new Error("protein should lead the method");
  if (!/flakes easily/.test(joined)) throw new Error("fish should get fish-specific cooking copy");
}

console.log("buildMethodSteps.test.ts: ok");
