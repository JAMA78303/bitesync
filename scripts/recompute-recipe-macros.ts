/**
 * One-off migration: recompute recipe macros using the corrected parser + CoFID matcher.
 *
 * Run ONLY after import-parser and CoFID matching fixes are merged.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run recompute:macros -- --dry-run
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run recompute:macros
 *
 * Options:
 *   --dry-run              Report only; no writes
 *   --user-id=<uuid>       Limit to one user
 *   --threshold=0.4        Calorie delta threshold for "significant" (default 0.4 = 40%)
 *   --with-ai              Enable AI fallback (non-deterministic; not recommended for idempotency)
 *   --report=<path>        Write JSON report (default: scripts/reports/macro-recompute-<ts>.json)
 */
import fs from "fs";
import path from "path";
import { loadEnvFiles } from "@/lib/supabase/loadEnv";
import { setCofidLookupSupabase } from "@/lib/nutrition/cofidLookup";
import {
  formatMacroRecomputeReport,
  runMacroRecomputeMigration,
  type MacroRecomputeReport,
  type PlannerChangeSnapshot,
} from "@/lib/recipes/macroRecompute";
import { createServiceClient } from "@/lib/supabase/service";

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const aiEnabled = argv.includes("--with-ai");
  const userArg = argv.find((a) => a.startsWith("--user-id="));
  const thresholdArg = argv.find((a) => a.startsWith("--threshold="));
  const reportArg = argv.find((a) => a.startsWith("--report="));

  const userId = userArg?.split("=")[1]?.trim() || undefined;
  const outlierThreshold = thresholdArg ? Number(thresholdArg.split("=")[1]) : 0.4;
  const reportPath =
    reportArg?.split("=")[1]?.trim() ||
    path.join(__dirname, "reports", `macro-recompute-${Date.now()}.json`);

  return { dryRun, aiEnabled, userId, outlierThreshold, reportPath };
}

async function main() {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));
  const supabase = createServiceClient();
  setCofidLookupSupabase(supabase);

  console.log("Starting macro recompute migration…");
  if (args.dryRun) console.log("DRY RUN — no database writes will be performed.\n");

  // The migration runs in batches of MACRO_RECOMPUTE_BATCH_SIZE so the admin
  // page can show progress. This script used to run exactly one batch and
  // report it as the whole migration — "Recipes scanned: 100, changed: 1" with
  // 95 never looked at. Loop until the migration says it is done, carrying the
  // planner snapshots forward so the final batch's planner report covers
  // every significant change, not just the last five recipes.
  let offset = 0;
  let report: Awaited<ReturnType<typeof runMacroRecomputeMigration>> | null = null;
  const snapshots: PlannerChangeSnapshot[] = [];
  const merged = { recomputed: 0, unchanged: 0, significantChanges: [] as MacroRecomputeReport["significantChanges"], errors: [] as MacroRecomputeReport["errors"] };

  for (;;) {
    const batch = await runMacroRecomputeMigration({
      supabase,
      dryRun: args.dryRun,
      userId: args.userId,
      aiEnabled: args.aiEnabled,
      outlierThreshold: Number.isFinite(args.outlierThreshold) ? args.outlierThreshold : 0.4,
      offset,
      plannerSnapshots: snapshots,
    });
    merged.recomputed += batch.recomputed;
    merged.unchanged += batch.unchanged;
    merged.significantChanges.push(...batch.significantChanges);
    merged.errors.push(...batch.errors);
    snapshots.push(
      ...batch.significantChanges.map((r) => ({
        recipeId: r.recipeId,
        recipeName: r.recipeName,
        userId: r.userId,
        oldCalories: r.oldCalories,
        newCalories: r.newCalories,
      })),
    );
    process.stdout.write(`  batch ${batch.batchOffset}–${batch.nextOffset} of ${batch.totalRecipes}: ${batch.recomputed} changed\n`);
    report = { ...batch, ...merged };
    if (!batch.hasMore) break;
    offset = batch.nextOffset;
  }
  if (!report) throw new Error("No recipes to recompute");

  const text = formatMacroRecomputeReport(report);
  console.log("\n" + text);

  fs.mkdirSync(path.dirname(args.reportPath), { recursive: true });
  fs.writeFileSync(args.reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to ${args.reportPath}`);

  if (report.errors.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
