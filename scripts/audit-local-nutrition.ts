/**
 * Read-only plausibility audit of the local nutrition table.
 *
 * The local table answers whenever CoFID has no match or a match is vetoed as
 * the wrong food, and its sodium and saturated fat fill gaps in CoFID and AI
 * answers. Much of `nutrition-db-uk-expansion*.ts` was template-generated, not
 * sourced. This flags rows that cannot be right:
 *   - energy that doesn't reconcile with 4/4/9/2 kcal per g of protein,
 *     carbohydrate, fat and fibre
 *   - 0 g fat on a food that has fat; sugar above carbohydrate; saturated fat
 *     above fat
 *   - kcal far outside the food's class (cake under 150, fresh veg over 120)
 *   - clusters of near-identical template values
 *
 * Rows with a source comment above them (`// CoFID 13-426 …`) are reported as
 * sourced. With --usage it also resolves every ingredient name stored in
 * recipe_ingredients through the app's lookup chain (Supabase reads only) and
 * shows which local rows real recipes reach.
 *
 * Writes nothing.
 *
 * Usage:
 *   npm run audit:local-nutrition
 *   npm run audit:local-nutrition -- --all            # every flagged row
 *   npm run audit:local-nutrition -- --usage          # + stored recipe names
 *   npm run audit:local-nutrition -- --usage --env-dir=/path/to/checkout
 */
import fs from "fs";
import path from "path";
import type { NutritionLookupEntry } from "@/types";
import { NUTRITION_DB } from "@/lib/nutrition/nutrition-db";
import { NUTRITION_DB_UK_EXPANSION } from "@/lib/nutrition/nutrition-db-uk-expansion";
import { NUTRITION_DB_UK_EXPANSION_PART2 } from "@/lib/nutrition/nutrition-db-uk-expansion-part2";
import { classFlags, energyCheck, energyReconciles, templateClusters } from "@/lib/nutrition/tableAudit";

const TABLES = [
  { label: "expansion part 1", file: "lib/nutrition/nutrition-db-uk-expansion.ts", rows: NUTRITION_DB_UK_EXPANSION },
  { label: "expansion part 2", file: "lib/nutrition/nutrition-db-uk-expansion-part2.ts", rows: NUTRITION_DB_UK_EXPANSION_PART2 },
] as const;

type Finding = { table: string; name: string; live: boolean; sourced: boolean; reasons: string[] };

function parseArgs(argv: string[]) {
  const envDir = argv.find((a) => a.startsWith("--env-dir="))?.split("=")[1];
  return { all: argv.includes("--all"), usage: argv.includes("--usage"), envDir };
}

/** Names whose tuple has a `//` comment directly above it in the source file. */
function sourcedNames(file: string): Set<string> {
  const text = fs.readFileSync(path.join(process.cwd(), file), "utf8");
  const out = new Set<string>();
  for (const m of text.matchAll(/\/\/[^\n]*\n {2}\[\n {4}"([^"]+)",/g)) out.add(m[1]);
  return out;
}

function fmtRow(e: NutritionLookupEntry): string {
  const p = e.per_100g;
  return `${p.calories} kcal, P ${p.protein_g} C ${p.carbs_g} F ${p.fat_g} fibre ${p.fibre_g}`;
}

function audit(): Finding[] {
  const live = new Set(NUTRITION_DB);
  const findings: Finding[] = [];
  for (const table of TABLES) {
    const sourced = sourcedNames(table.file);
    const clusters = templateClusters(table.rows);
    for (const row of table.rows) {
      const reasons: string[] = [];
      if (!energyReconciles(row)) {
        const e = energyCheck(row);
        reasons.push(`energy: states ${e.stated} kcal, macros give ${Math.round(e.expected)}`);
      }
      for (const f of classFlags(row)) reasons.push(`${f.check}: ${f.detail}`);
      for (const why of clusters.get(row.name) ?? []) reasons.push(`template: ${why}`);
      if (reasons.length) {
        findings.push({
          table: table.label,
          name: row.name,
          live: live.has(row),
          sourced: sourced.has(row.name),
          reasons,
        });
      }
    }
  }
  return findings;
}

function printSummary(findings: Finding[], all: boolean) {
  for (const table of TABLES) {
    const sourced = sourcedNames(table.file);
    const mine = findings.filter((f) => f.table === table.label);
    const byCheck = new Map<string, number>();
    for (const f of mine) {
      for (const check of new Set(f.reasons.map((r) => r.split(":")[0]))) {
        byCheck.set(check, (byCheck.get(check) ?? 0) + 1);
      }
    }
    console.log(
      `\n${table.label}: ${table.rows.length} rows, ${sourced.size} with a source comment, ${mine.length} flagged`,
    );
    for (const [check, n] of [...byCheck].sort((a, b) => b[1] - a[1])) console.log(`  ${check.padEnd(10)} ${n}`);
  }

  const shown = all ? findings : findings.filter((f) => f.live).slice(0, 40);
  console.log(`\n${all ? "All flagged rows" : "First 40 flagged live rows (--all for every row)"}:`);
  for (const f of shown) {
    const tags = [f.live ? "" : "shadowed", f.sourced ? "sourced" : ""].filter(Boolean).join(", ");
    console.log(`  ${f.name}${tags ? ` (${tags})` : ""}`);
    for (const r of f.reasons) console.log(`      ${r}`);
  }
}

async function printUsage(findings: Finding[], envDir: string | undefined) {
  const { loadEnvFiles } = await import("@/lib/supabase/loadEnv");
  const { createServiceClient } = await import("@/lib/supabase/service");
  const { setCofidLookupSupabase } = await import("@/lib/nutrition/cofidLookup");
  const { lookupNutrition } = await import("@/lib/nutrition/lookup");
  const { lookupNutritionAsync } = await import("@/lib/nutrition/lookupAsync");

  loadEnvFiles(envDir ?? process.cwd());
  const supabase = createServiceClient();
  setCofidLookupSupabase(supabase);

  const counts = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("recipe_ingredients")
      .select("name")
      .range(from, from + 999);
    if (error) throw new Error(`Could not read recipe_ingredients: ${error.message}`);
    for (const row of data ?? []) {
      const name = String(row.name ?? "").trim().toLowerCase();
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    if (!data || data.length < 1000) break;
  }

  const expansion = new Map<NutritionLookupEntry, string>();
  for (const t of TABLES) for (const r of t.rows) expansion.set(r, t.label);
  const flagged = new Map(findings.map((f) => [`${f.table}|${f.name}`, f]));

  console.log(`\nStored recipe ingredients: ${counts.size} distinct names.`);
  console.log("Names that reach an expansion-table row (uses, name -> row, who answers today):");
  const sorted = [...counts].sort((a, b) => b[1] - a[1]);
  for (const [name, n] of sorted) {
    const local = lookupNutrition(name);
    const table = local ? expansion.get(local) : undefined;
    if (!local || !table) continue;
    const resolved = await lookupNutritionAsync(name, 100, "g", { skipAI: true });
    const f = flagged.get(`${table}|${local.name}`);
    const status = f ? (f.sourced ? "flagged, sourced" : "FLAGGED") : "ok";
    console.log(
      `  ${String(n).padStart(4)}  ${name} -> ${local.name} [${fmtRow(local)}] — ${resolved?.source ?? "none"}, ${status}`,
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const findings = audit();
  printSummary(findings, args.all);
  if (args.usage) await printUsage(findings, args.envDir);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
