/**
 * Builds sql/cofid_import/index.html — one-click copy per part for Supabase.
 * Usage: npm run export:cofid-copy-page  (runs after export:cofid-sql)
 */
import fs from "fs";
import path from "path";

const DIR = path.join(__dirname, "..", "sql", "cofid_import");

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function main() {
  const files = fs
    .readdirSync(DIR)
    .filter((f) => /^part_\d{2}\.sql$/.test(f))
    .sort();

  if (!files.length) {
    console.error("No part_XX.sql files — run npm run export:cofid-sql first.");
    process.exit(1);
  }

  const sections = files.map((filename, i) => {
    const sql = fs.readFileSync(path.join(DIR, filename), "utf-8").trim();
    const label = filename.replace(".sql", "").replace("_", " ").toUpperCase();
    return `
    <section class="part">
      <div class="head">
        <h2>${label} <span class="file">${filename}</span></h2>
        <button type="button" class="copy" data-idx="${i}">Copy SQL</button>
        <span class="status" id="status-${i}"></span>
      </div>
      <textarea id="sql-${i}" readonly spellcheck="false">${escapeHtml(sql)}</textarea>
    </section>`;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CoFID import — copy parts 01–${String(files.length).padStart(2, "0")}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; max-width: 960px; margin: 0 auto; padding: 24px; background: #f8fafc; color: #0f172a; }
    h1 { font-size: 1.25rem; margin-bottom: 8px; }
    .intro { color: #64748b; font-size: 0.9rem; margin-bottom: 24px; line-height: 1.5; }
    .part { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
    .head { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
    h2 { margin: 0; font-size: 0.95rem; flex: 1; }
    .file { color: #94a3b8; font-weight: normal; font-size: 0.8rem; }
    .copy { background: #3a5a40; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; }
    .copy:hover { background: #2d4733; }
    .status { font-size: 0.8rem; color: #16a34a; }
    textarea { width: 100%; height: 120px; border: none; padding: 12px 16px; font-family: ui-monospace, monospace; font-size: 11px; resize: vertical; background: #f1f5f9; }
    ol.steps { margin: 0 0 20px 1.2rem; font-size: 0.9rem; color: #475569; }
  </style>
</head>
<body>
  <h1>CoFID import for Supabase</h1>
  <p class="intro">Run each part in the Supabase SQL editor: click <strong>Copy SQL</strong>, paste into a new query, Run. Do parts in order (01 → ${String(files.length).padStart(2, "0")}).</p>
  <ol class="steps">
    <li>Table must exist (<code>sql/2026-05-24_cofid_foods.sql</code> already run).</li>
    <li>Copy + run each part below in order.</li>
    <li><code>SELECT COUNT(*) FROM cofid_foods;</code> → expect ~2886</li>
    <li>Then run <code>sql/2026-05-24_cofid_overrides_seed.sql</code></li>
  </ol>
  ${sections.join("\n")}
  <script>
    document.querySelectorAll(".copy").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const i = btn.getAttribute("data-idx");
        const ta = document.getElementById("sql-" + i);
        const st = document.getElementById("status-" + i);
        try {
          await navigator.clipboard.writeText(ta.value);
          st.textContent = "Copied!";
          setTimeout(() => { st.textContent = ""; }, 2000);
        } catch (e) {
          ta.select();
          document.execCommand("copy");
          st.textContent = "Copied (fallback)";
        }
      });
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(DIR, "index.html"), html, "utf-8");
  console.log(`Wrote sql/cofid_import/index.html (${files.length} parts)`);
}

main();
