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

console.log("buildMethodSteps.test.ts: ok");
