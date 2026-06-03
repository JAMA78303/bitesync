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

  const report = await runMacroRecomputeMigration({
    supabase,
    dryRun: args.dryRun,
    userId: args.userId,
    aiEnabled: args.aiEnabled,
    outlierThreshold: Number.isFinite(args.outlierThreshold) ? args.outlierThreshold : 0.4,
  });

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
