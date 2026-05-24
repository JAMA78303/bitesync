/**
 * Small SQL chunks for CoFID rows 2401–2886 (original parts 13–15).
 * Use when the Supabase editor times out on part_13–15.sql
 *
 * Usage: npx tsx scripts/generate-cofid-retry-13-15.ts
 */
import fs from "fs";
import path from "path";
import { loadRows, type CofidRow } from "./import-cofid";

const OUT_DIR = path.join(__dirname, "..", "sql", "cofid_import", "retry_13_15");
const START_INDEX = 2400; // 0-based: rows after part 12 (12 × 200)
const ROWS_PER_FILE = 15;

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
  return `(${[
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
  ].join(", ")})`;
}

function upsertSql(rows: CofidRow[]): string {
  const colList = COLUMNS.join(", ");
  const updates = COLUMNS.filter((c) => c !== "food_code")
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(",\n  ");
  return `-- ${rows.length} foods (safe to re-run)
INSERT INTO public.cofid_foods (${colList})
VALUES
  ${rows.map(rowValues).join(",\n  ")}
ON CONFLICT (food_code) DO UPDATE SET
  ${updates};`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function main() {
  const all = loadRows();
  const tail = all.slice(START_INDEX);
  if (!tail.length) {
    console.error("No rows in tail slice.");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const fileCount = Math.ceil(tail.length / ROWS_PER_FILE);
  const sections: string[] = [];

  for (let f = 0; f < fileCount; f += 1) {
    const slice = tail.slice(f * ROWS_PER_FILE, (f + 1) * ROWS_PER_FILE);
    const num = String(f + 1).padStart(2, "0");
    const filename = `chunk_${num}.sql`;
    const sql = upsertSql(slice);
    fs.writeFileSync(path.join(OUT_DIR, filename), sql, "utf-8");
    sections.push(`
    <section class="part">
      <div class="head">
        <h2>Chunk ${num} <span class="file">${filename}</span> (${slice.length} foods)</h2>
        <button type="button" class="copy" data-idx="${f}">Copy SQL</button>
        <span class="status" id="status-${f}"></span>
      </div>
      <textarea id="sql-${f}" readonly spellcheck="false">${escapeHtml(sql)}</textarea>
    </section>`);
  }

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>CoFID retry parts 13–15</title>
<style>
body{font-family:system-ui;max-width:960px;margin:0 auto;padding:24px;background:#f8fafc}
.part{background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px}
.head{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap}
h2{margin:0;font-size:0.9rem;flex:1}.file{color:#94a3b8;font-weight:normal}
.copy{background:#3a5a40;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer}
textarea{width:100%;height:100px;border:none;padding:12px;font-family:monospace;font-size:11px;background:#f1f5f9}
.intro{color:#64748b;font-size:0.9rem;margin-bottom:20px;line-height:1.5}
</style></head><body>
<h1>CoFID retry — parts 13–15 only</h1>
<p class="intro">Smaller chunks (~15 foods each) after <code>api.supabase.com</code> failed on the large part_13–15 files.
Run chunks <strong>01 → ${String(fileCount).padStart(2, "0")}</strong> in order. Safe to re-run (upsert).</p>
${sections.join("")}
<script>
document.querySelectorAll(".copy").forEach(btn=>{btn.onclick=async()=>{const i=btn.dataset.idx;const ta=document.getElementById("sql-"+i);const st=document.getElementById("status-"+i);try{await navigator.clipboard.writeText(ta.value);st.textContent="Copied!";setTimeout(()=>st.textContent="",2000)}catch(e){ta.select();document.execCommand("copy");st.textContent="Copied"}}});
</script></body></html>`;

  fs.writeFileSync(path.join(OUT_DIR, "index.html"), html, "utf-8");

  const readme = `# Retry import (parts 13–15 only)

Parts 01–12 done? The dashboard often fails on \`part_13.sql\`–\`part_15.sql\` with **Load failed (api.supabase.com)**.

Use **smaller chunks** in this folder:

1. Open \`index.html\` in your browser
2. Copy + run each \`chunk_XX.sql\` in Supabase (01 → ${String(fileCount).padStart(2, "0")})
3. \`SELECT COUNT(*) FROM cofid_foods;\` → expect **2886**
4. Run \`sql/2026-05-24_cofid_overrides_seed.sql\`

Files: ${fileCount} chunks × ${ROWS_PER_FILE} foods (~3–4 KB each).
`;

  fs.writeFileSync(path.join(OUT_DIR, "README.md"), readme, "utf-8");
  console.log(`Wrote ${tail.length} rows as ${fileCount} chunks in sql/cofid_import/retry_13_15/`);
  console.log("Open: sql/cofid_import/retry_13_15/index.html");
}

main();
