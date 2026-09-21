/**
 * One-off: convert generated recipes' grain rows from cooked grams to dry.
 *
 * Until 2026-09-21 the engine expressed rice, pasta and quinoa in cooked
 * grams ("315 g rice") and costed them on the boiled row. Grains are now dry,
 * as bought, and a bare "rice" is costed on the raw row — so a stored 315 g
 * would be read as 315 g dry and triple. This divides each such row by the
 * grain's water factor (315 → 110) so the recipe means what it always meant.
 *
 * Only recipes the engine wrote (recipe_source = 'ai'). Imported and manual
 * recipes were typed by a person in dry grams already and must not change.
 *
 *   npx tsx scripts/convert-ai-grains-to-dry.ts --dry-run
 *   npx tsx scripts/convert-ai-grains-to-dry.ts
 *
 * Run the macro recompute afterwards.
 */
import { loadEnvFiles } from "@/lib/supabase/loadEnv";
import { createServiceClient } from "@/lib/supabase/service";
import { dryWeightFor, isDryWeightGrain } from "@/lib/recipes/cookedWeight";

async function main() {
  loadEnvFiles();
  const dryRun = process.argv.includes("--dry-run");
  const supabase = createServiceClient();

  const { data: rows, error } = await supabase
    .from("recipe_ingredients")
    .select("id, name, quantity, unit, recipe_id, recipes!inner(name, recipe_source)")
    .eq("unit", "g")
    .eq("recipes.recipe_source", "ai");
  if (error) throw new Error(error.message);

  type Row = { id: string; name: string; quantity: number; recipes: { name: string } | { name: string }[] };
  const grains = ((rows ?? []) as unknown as Row[]).filter((r) => isDryWeightGrain(r.name));

  let changed = 0;
  for (const r of grains) {
    const dry = dryWeightFor(r.name, Number(r.quantity));
    if (dry == null || dry === Number(r.quantity)) continue;
    const recipe = Array.isArray(r.recipes) ? r.recipes[0] : r.recipes;
    console.log(`  ${String(r.quantity).padStart(4)} g → ${String(dry).padStart(4)} g  ${r.name.padEnd(12)}  ${recipe?.name ?? ""}`);
    if (!dryRun) {
      const { error: upErr } = await supabase.from("recipe_ingredients").update({ quantity: dry }).eq("id", r.id);
      if (upErr) throw new Error(`${r.id}: ${upErr.message}`);
    }
    changed += 1;
  }
  console.log(`${dryRun ? "Would convert" : "Converted"} ${changed} of ${grains.length} grain rows in generated recipes.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
