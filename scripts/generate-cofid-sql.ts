/**
 * Generate batched UPSERT SQL for cofid_foods (Supabase SQL editor–friendly chunks).
 * Usage: npm run export:cofid-sql
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { loadRows, type CofidRow } from "./import-cofid";

const OUT_DIR = path.join(__dirname, "..", "sql", "cofid_import");
/** Rows per INSERT statement (keep statements small). */
const INSERT_BATCH = 25;
/** Rows per file (run files 01, 02, … in order in Supabase SQL editor). */
const ROWS_PER_FILE = 200;

const COLUMNS = [
  "food_code",
  "food_name",
  "food_group",
  "kcal",
  "protein_g",
  "fat_g",
  "carbs_g",
  "sugars_g",
  "fibre_g",
  "sodium_mg",
  "salt_g",
  "vitamin_a_ug",
  "vitamin_d_ug",
  "vitamin_e_mg",
  "vitamin_k_ug",
  "vitamin_c_mg",
  "thiamin_mg",
  "riboflavin_mg",
  "niacin_mg",
  "vitamin_b6_mg",
  "vitamin_b12_ug",
  "folate_ug",
  "calcium_mg",
  "iron_mg",
  "zinc_mg",
  "magnesium_mg",
  "potassium_mg",
  "phosphorus_mg",
  "selenium_ug",
  "iodine_ug",
] as const;

function sqlStr(v: string | null): string {
  if (v == null) return "NULL";
  return `'${v.replace(/'/g, "''")}'`;
}

function sqlNum(v: number | null | undefined): string {
  if (v == null || v === undefined) return "NULL";
  return String(v);
}

function rowValues(r: CofidRow): string {
  const vals = [
    sqlStr(r.food_code),
    sqlStr(r.food_name),
    sqlStr(r.food_group),
    sqlNum(r.kcal),
    sqlNum(r.protein_g),
    sqlNum(r.fat_g),
    sqlNum(r.carbs_g),
    sqlNum(r.sugars_g),
    sqlNum(r.fibre_g),
    sqlNum(r.sodium_mg),
    sqlNum(r.salt_g),
    sqlNum(r.vitamin_a_ug),
    sqlNum(r.vitamin_d_ug),
    sqlNum(r.vitamin_e_mg),
    sqlNum(r.vitamin_k_ug),
    sqlNum(r.vitamin_c_mg),
    sqlNum(r.thiamin_mg),
    sqlNum(r.riboflavin_mg),
    sqlNum(r.niacin_mg),
    sqlNum(r.vitamin_b6_mg),
    sqlNum(r.vitamin_b12_ug),
    sqlNum(r.folate_ug),
    sqlNum(r.calcium_mg),
    sqlNum(r.iron_mg),
    sqlNum(r.zinc_mg),
    sqlNum(r.magnesium_mg),
    sqlNum(r.potassium_mg),
    sqlNum(r.phosphorus_mg),
    sqlNum(r.selenium_ug),
    sqlNum(r.iodine_ug),
  ];
  return `(${vals.join(", ")})`;
}

function upsertBatch(rows: CofidRow[]): string {
  const colList = COLUMNS.join(", ");
  const updates = COLUMNS.filter((c) => c !== "food_code")
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(",\n  ");
  const values = rows.map(rowValues).join(",\n  ");
  return `INSERT INTO public.cofid_foods (${colList})
VALUES
  ${values}
ON CONFLICT (food_code) DO UPDATE SET
  ${updates};`;
}

function main() {
  const rows = loadRows();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const fileCount = Math.ceil(rows.length / ROWS_PER_FILE);
  const manifest: string[] = [
    "# CoFID import — run in Supabase SQL editor",
    "",
    "Prerequisite: `sql/2026-05-24_cofid_foods.sql` (table already created).",
    "",
    "Run each file below **in order** (01 → " + String(fileCount).padStart(2, "0") + ").",
    "Do not use the old single `2026-05-24_cofid_foods_import.sql` (too large for the editor).",
    "",
    "After all parts: `SELECT COUNT(*) FROM cofid_foods;` → expect ~" + rows.length,
    "",
    "Then run: `sql/2026-05-24_cofid_overrides_seed.sql`",
    "",
  ];

  for (let f = 0; f < fileCount; f += 1) {
    const slice = rows.slice(f * ROWS_PER_FILE, (f + 1) * ROWS_PER_FILE);
    const num = String(f + 1).padStart(2, "0");
    const parts: string[] = [
      `-- CoFID import part ${num}/${String(fileCount).padStart(2, "0")} (${slice.length} foods)`,
      `-- Run after sql/2026-05-24_cofid_foods.sql`,
    ];

    for (let i = 0; i < slice.length; i += INSERT_BATCH) {
      parts.push(upsertBatch(slice.slice(i, i + INSERT_BATCH)));
    }

    const filename = `part_${num}.sql`;
    fs.writeFileSync(path.join(OUT_DIR, filename), parts.join("\n\n"), "utf-8");
    manifest.push(`- [ ] \`${filename}\` (${slice.length} rows)`);
  }

  fs.writeFileSync(path.join(OUT_DIR, "README.md"), manifest.join("\n"), "utf-8");

  const legacyPath = path.join(__dirname, "..", "sql", "2026-05-24_cofid_foods_import.sql");
  if (fs.existsSync(legacyPath)) {
    fs.unlinkSync(legacyPath);
  }

  console.log(`Wrote ${rows.length} rows across ${fileCount} files in sql/cofid_import/`);

  spawnSync("npx", ["tsx", "scripts/generate-cofid-copy-page.ts"], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });
}

main();
