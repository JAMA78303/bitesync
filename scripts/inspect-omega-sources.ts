/**
 * Surfaces CoFID omega-3 / omega-6 rows for curating lib/nutrition/omega-values.ts.
 *
 * The weekly micro analysis reads `lookupMicros`, a hand-authored local table —
 * not CoFID — so omega values have to land there. Hand-authoring 212 foods would
 * mean inventing numbers, so they are matched to real CoFID rows instead.
 *
 * Two traps this deliberately avoids:
 *
 *  - The CSV has BOTH "n-3 poly /100g FA" (share of fat) and "n-3 poly /100g
 *    food" (absolute). Sardines read 31.92 in the first and ~2 in the second;
 *    picking the wrong column inflates everything ~15x. Columns are located by
 *    header text, never by index.
 *  - Blank and "N" mean NOT MEASURED, which is not zero. Treating them as zero
 *    is the silent-zero failure that makes a food read as a deficiency — the bug
 *    behind vitamin D showing 5%. Only measured values are emitted.
 *
 * Inspection only — it does NOT write the data file. Auto-matching was tried and
 * rejected (blue cheese -> salad dressing, chicken thigh -> chicken skin), so
 * lib/nutrition/omega-values.ts is curated by hand from the rows this surfaces.
 *
 *   npm run inspect:omega
 */
import fs from "fs";
import path from "path";
import { MICRO_DB } from "@/lib/nutrition/micros";
import { pickBestCofidCandidate, type CofidCandidate } from "@/lib/nutrition/cofidMatch";

const CSV = path.join(
  __dirname,
  "McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021.csv",
);

/** RFC-ish CSV line parser — the dataset has quoted fields containing commas. */
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** CoFID sentinels: "" and "N" are unmeasured; "Tr" is a measured trace. */
function parseNutrient(raw: string | undefined): number | null {
  const v = (raw ?? "").trim();
  if (!v || v.toUpperCase() === "N") return null;
  if (v.toLowerCase() === "tr") return 0;
  const n = Number(v.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function main() {
  const raw = fs.readFileSync(CSV, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = parseLine(lines[0]!);

  const n3Idx = header.findIndex((h) => /n-3 poly \/100g food/i.test(h));
  const n6Idx = header.findIndex((h) => /n-6 poly \/100g food/i.test(h));
  if (n3Idx < 0 || n6Idx < 0) {
    console.error("Could not locate omega columns by header — aborting rather than guessing.");
    process.exit(1);
  }
  console.log(`n-3 column ${n3Idx}: "${header[n3Idx]}"`);
  console.log(`n-6 column ${n6Idx}: "${header[n6Idx]}"\n`);

  type Row = { code: string; name: string; group: string; n3: number | null; n6: number | null };
  const rows: Row[] = [];
  for (const line of lines.slice(1)) {
    const c = parseLine(line);
    const name = (c[1] ?? "").trim();
    if (!name) continue;
    rows.push({
      code: (c[0] ?? "").trim(),
      name,
      group: (c[2] ?? "").trim(),
      n3: parseNutrient(c[n3Idx]),
      n6: parseNutrient(c[n6Idx]),
    });
  }
  const measured = rows.filter((r) => r.n3 != null || r.n6 != null);
  console.log(`CoFID rows: ${rows.length}, with measured omega: ${measured.length}\n`);

  const foods = Object.keys(MICRO_DB).sort();
  const resolved: { food: string; n3: number; n6: number; via: string }[] = [];
  const unmatched: string[] = [];

  for (const food of foods) {
    // Only consider rows that actually carry a measured value; matching to a row
    // with no data would produce a confident-looking zero.
    const tokens = food.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const candidates: CofidCandidate[] = measured
      .filter((r) => tokens.some((t) => r.name.toLowerCase().includes(t)))
      .map((r) => ({
        food_code: r.code,
        food_name: r.name,
        food_group: r.group,
        matchKind: "partial" as const,
      }));

    const best = candidates.length ? pickBestCofidCandidate(food, candidates) : null;
    if (!best) {
      unmatched.push(food);
      continue;
    }
    const row = measured.find((r) => r.code === best.food_code)!;
    resolved.push({
      food,
      n3: row.n3 ?? 0,
      n6: row.n6 ?? 0,
      via: row.name,
    });
  }

  console.log(`Matched ${resolved.length} of ${foods.length} foods; ${unmatched.length} unmatched.\n`);
  console.log("Highest omega-3 matches (sanity check — oily fish, nuts, seeds should lead):");
  for (const r of [...resolved].sort((a, b) => b.n3 - a.n3).slice(0, 15)) {
    console.log(`  ${r.food.padEnd(22)} n3=${String(r.n3).padEnd(6)} n6=${String(r.n6).padEnd(6)} via "${r.via.slice(0, 46)}"`);
  }
  console.log("\nUnmatched (no measured CoFID row):");
  console.log("  " + (unmatched.join(", ") || "(none)"));

  console.log(
    "\nInspection only — omega-values.ts is curated by hand, because auto-matching" +
      "\nresolved blue cheese to a salad dressing and chicken thigh to chicken skin.",
  );
}

main();
