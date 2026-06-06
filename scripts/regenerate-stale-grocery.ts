/**
 * Audit / regenerate stale grocery snapshots (frozen rows from old generates).
 *
 * Usage:
 *   npm run regenerate:grocery -- --dry-run
 *   npm run regenerate:grocery -- --apply
 *   npm run regenerate:grocery -- --apply --meal-plan-id=<uuid>
 */
import fs from "fs";
import path from "path";
import { findStaleGroceryPlans, regeneratePlanGrocery } from "@/lib/grocery/regeneratePlanGrocery";
import { loadEnvFiles } from "@/lib/supabase/loadEnv";
import { createServiceClient } from "@/lib/supabase/service";

function parseArgs(argv: string[]) {
  const dryRun = !argv.includes("--apply");
  const planArg = argv.find((a) => a.startsWith("--meal-plan-id="));
  const reportArg = argv.find((a) => a.startsWith("--report="));
  return {
    dryRun,
    mealPlanId: planArg?.split("=")[1]?.trim(),
    reportPath:
      reportArg?.split("=")[1]?.trim() ||
      path.join(__dirname, "reports", `stale-grocery-${Date.now()}.json`),
  };
}

async function main() {
  loadEnvFiles();
  const { dryRun, mealPlanId, reportPath } = parseArgs(process.argv.slice(2));
  const supabase = createServiceClient();

  console.log(dryRun ? "DRY RUN — listing stale grocery plans only.\n" : "APPLY — regenerating stale grocery plans.\n");

  let plans = await findStaleGroceryPlans(supabase);
  if (mealPlanId) plans = plans.filter((p) => p.mealPlanId === mealPlanId);

  console.log(`Found ${plans.length} meal plan(s) with likely stale rows.\n`);
  for (const p of plans.slice(0, 20)) {
    console.log(
      `  ${p.mealPlanId} · week ${p.weekStartDate} · ${p.staleItemCount}/${p.totalItems} stale`,
    );
  }
  if (plans.length > 20) console.log(`  … and ${plans.length - 20} more`);

  const results: { mealPlanId: string; ok: boolean; itemCount?: number; error?: string }[] = [];

  if (!dryRun) {
    for (const plan of plans) {
      const { data: scopeRow } = await supabase
        .from("meal_plans")
        .select("grocery_scope_days")
        .eq("id", plan.mealPlanId)
        .maybeSingle();
      const scopeDays = (scopeRow?.grocery_scope_days ?? null) as number[] | null;
      const result = await regeneratePlanGrocery(
        supabase,
        plan.mealPlanId,
        scopeDays?.length ? scopeDays : undefined,
      );
      if (result.ok) {
        results.push({ mealPlanId: plan.mealPlanId, ok: true, itemCount: result.itemCount });
        console.log(`✓ ${plan.mealPlanId} → ${result.itemCount} items`);
      } else {
        results.push({ mealPlanId: plan.mealPlanId, ok: false, error: result.error });
        console.log(`✗ ${plan.mealPlanId}: ${result.error}`);
      }
    }
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ dryRun, plans, results, generatedAt: new Date().toISOString() }, null, 2),
  );
  console.log(`\nReport saved to ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
