/**
 * One-time CoFID import into Supabase (idempotent upsert on food_code).
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run import:cofid
 *
 * Data files (not committed — see scripts/README-cofid.md):
 *   scripts/cofid_2021.xlsx  — full dataset from gov.uk (preferred)
 *   scripts/cofid_2021.csv    — Kaggle CSV fallback (macros only)
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const XLSX_PATH = path.join(__dirname, "cofid_2021.xlsx");
const CSV_PATH = path.join(__dirname, "cofid_2021.csv");

export type CofidRow = {
  food_code: string;
  food_name: string;
  food_group: string | null;
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  saturated_fat_g: number | null;
  carbs_g: number | null;
  sugars_g: number | null;
  fibre_g: number | null;
  sodium_mg: number | null;
  salt_g: number | null;
  vitamin_a_ug: number | null;
  retinol_ug: number | null;
  vitamin_d_ug: number | null;
  vitamin_e_mg: number | null;
  vitamin_k_ug: number | null;
  vitamin_c_mg: number | null;
  thiamin_mg: number | null;
  riboflavin_mg: number | null;
  niacin_mg: number | null;
  vitamin_b6_mg: number | null;
  vitamin_b12_ug: number | null;
  folate_ug: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  zinc_mg: number | null;
  magnesium_mg: number | null;
  potassium_mg: number | null;
  phosphorus_mg: number | null;
  selenium_ug: number | null;
  iodine_ug: number | null;
};

export function parseNumeric(val: unknown): number | null {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s || s === "-" || s === "N") return null;
  if (s.toLowerCase() === "tr") return 0.01;
  const n = parseFloat(s.replace(/[^0-9.-]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function str(val: unknown): string {
  return val == null ? "" : String(val).trim();
}

function foodCode(val: unknown): string {
  return str(val);
}

function saltFromSodium(sodiumMg: number | null): number | null {
  if (sodiumMg == null) return null;
  return (sodiumMg * 2.5) / 1000;
}

function fibreFromRow(row: Record<string, unknown>): number | null {
  return (
    parseNumeric(row["AOAC fibre (g)"]) ??
    parseNumeric(row["NSP (g)"]) ??
    parseNumeric(row["Fibre (g)"])
  );
}

function mapProximates(row: Record<string, unknown>): Partial<CofidRow> {
  const sodium_mg = parseNumeric(row["Sodium (mg)"]);
  return {
    food_code: foodCode(row["Food Code"]),
    food_name: str(row["Food Name"]),
    food_group: str(row["Group"]) || null,
    kcal: parseNumeric(row["Energy (kcal) (kcal)"] ?? row["Energy (kcal)"]),
    protein_g: parseNumeric(row["Protein (g)"]),
    fat_g: parseNumeric(row["Fat (g)"]),
    saturated_fat_g: parseNumeric(
      row["Satd FA /100g fd (g)"] ??
        row["Satd FA /100g food (g)"] ??
        row["Satd FA /100g (g)"] ??
        row["Saturated fatty acids (g)"] ??
        row["Satd FA (g)"],
    ),
    carbs_g: parseNumeric(row["Carbohydrate (g)"]),
    sugars_g: parseNumeric(row["Total sugars (g)"]),
    fibre_g: fibreFromRow(row),
    sodium_mg,
    salt_g: parseNumeric(row["Salt (g)"]) ?? saltFromSodium(sodium_mg),
  };
}

function mapInorganics(row: Record<string, unknown>): Partial<CofidRow> {
  const code = foodCode(row["Food Code"] ?? row[" "]);
  return {
    food_code: code,
    sodium_mg: parseNumeric(row["Sodium (mg)"]),
    potassium_mg: parseNumeric(row["Potassium (mg)"]),
    calcium_mg: parseNumeric(row["Calcium (mg)"]),
    magnesium_mg: parseNumeric(row["Magnesium (mg)"]),
    phosphorus_mg: parseNumeric(row["Phosphorus (mg)"]),
    iron_mg: parseNumeric(row["Iron (mg)"]),
    zinc_mg: parseNumeric(row["Zinc (mg)"]),
    selenium_ug: parseNumeric(row["Selenium (µg)"] ?? row["Selenium (ug)"]),
    iodine_ug: parseNumeric(row["Iodine (µg)"] ?? row["Iodine (ug)"]),
  };
}

function mapVitamins(row: Record<string, unknown>): Partial<CofidRow> {
  return {
    food_code: foodCode(row["Food Code"]),
    vitamin_a_ug: parseNumeric(
      row["Retinol Equivalent (µg)"] ?? row["Vitamin A (µg)"] ?? row["Retinol Equivalent (ug)"],
    ),
    retinol_ug: parseNumeric(
      row["Retinol (µg)"] ?? row["Retinol (ug)"] ?? row["Preformed vitamin A (µg)"],
    ),
    vitamin_d_ug: parseNumeric(row["Vitamin D (µg)"] ?? row["Vitamin D (ug)"]),
    vitamin_e_mg: parseNumeric(row["Vitamin E (mg)"]),
    vitamin_k_ug: parseNumeric(row["Vitamin K1 (µg)"] ?? row["Vitamin K1 (ug)"]),
    vitamin_c_mg: parseNumeric(row["Vitamin C (mg)"]),
    thiamin_mg: parseNumeric(row["Thiamin (mg)"]),
    riboflavin_mg: parseNumeric(row["Riboflavin (mg)"]),
    niacin_mg: parseNumeric(row["Niacin equivalent (mg)"] ?? row["Niacin (mg)"]),
    vitamin_b6_mg: parseNumeric(row["Vitamin B6 (mg)"]),
    vitamin_b12_ug: parseNumeric(row["Vitamin B12 (µg)"] ?? row["Vitamin B12 (ug)"]),
    folate_ug: parseNumeric(row["Folate (µg)"] ?? row["Folate (ug)"]),
  };
}

function mergeRow(base: Partial<CofidRow>, extra: Partial<CofidRow>): Partial<CofidRow> {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    if (k === "food_code" || k === "food_name") continue;
    const key = k as keyof CofidRow;
    if (v != null && (out[key] == null || out[key] === undefined)) {
      (out as Record<string, unknown>)[key] = v;
    }
  }
  if (extra.sodium_mg != null) {
    out.sodium_mg = extra.sodium_mg;
    if (out.salt_g == null) out.salt_g = saltFromSodium(extra.sodium_mg);
  }
  return out;
}

function sheetRows(wb: XLSX.WorkBook, sheetName: string): Record<string, unknown>[] {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

function loadFromXlsx(): CofidRow[] {
  if (!fs.existsSync(XLSX_PATH)) {
    throw new Error(`Missing ${XLSX_PATH} — see scripts/README-cofid.md`);
  }
  const wb = XLSX.readFile(XLSX_PATH);
  const byCode = new Map<string, Partial<CofidRow>>();

  for (const row of sheetRows(wb, "1.3 Proximates")) {
    const code = foodCode(row["Food Code"]);
    if (!code) continue;
    byCode.set(code, mapProximates(row));
  }

  for (const row of sheetRows(wb, "1.4 Inorganics")) {
    const code = foodCode(row["Food Code"] ?? row[" "]);
    if (!code) continue;
    const existing = byCode.get(code) ?? { food_code: code, food_name: str(row["Food Name"]) };
    byCode.set(code, mergeRow(existing, mapInorganics(row)));
  }

  for (const row of sheetRows(wb, "1.5 Vitamins")) {
    const code = foodCode(row["Food Code"]);
    if (!code) continue;
    const existing = byCode.get(code) ?? { food_code: code, food_name: str(row["Food Name"]) };
    byCode.set(code, mergeRow(existing, mapVitamins(row)));
  }

  return [...byCode.values()]
    .filter((r) => r.food_code && r.food_name)
    .map((r) => r as CofidRow);
}

function loadFromCsv(): CofidRow[] {
  const csvPath = fs.existsSync(CSV_PATH)
    ? CSV_PATH
    : path.join(__dirname, "McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Missing ${CSV_PATH} or Kaggle CSV — see scripts/README-cofid.md`);
  }
  const csv = fs.readFileSync(csvPath, "utf-8");
  const { data, errors } = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  if (errors.length) {
    console.warn("Parse warnings:", errors.slice(0, 5));
  }
  return data
    .map((row) => mapProximates(row) as CofidRow)
    .filter((r) => r.food_code && r.food_name);
}

export function loadRows(): CofidRow[] {
  if (fs.existsSync(XLSX_PATH)) {
    return loadFromXlsx();
  }
  return loadFromCsv();
}

async function importCoFID() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  console.log("Loading from Excel (full macros + micros)...");
  const mapped = loadRows();
  console.log(`Parsed ${mapped.length} foods. Importing...`);

  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    const batch = mapped.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("cofid_foods").upsert(batch, { onConflict: "food_code" });

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`Upserted ${inserted}/${mapped.length}`);
  }

  console.log("Done.");
}

const isDirectRun =
  typeof process.argv[1] === "string" && process.argv[1].replace(/\\/g, "/").endsWith("import-cofid.ts");

if (isDirectRun) {
  importCoFID().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
