#!/usr/bin/env node
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3456";
const pages = [
  { path: "/", name: "landing" },
  { path: "/login", name: "login" },
  { path: "/planner", name: "planner" },
  { path: "/recipes", name: "recipes" },
  { path: "/nutrition", name: "nutrition" },
  { path: "/grocery", name: "grocery" },
];

mkdirSync("reports", { recursive: true });
const results = [];

for (const { path, name } of pages) {
  const out = join("reports", `lh-baseline-${name}.json`);
  const url = `${BASE}${path}`;
  console.log(`\nLighthouse: ${url}`);
  try {
    execSync(
      `npx lighthouse "${url}" --only-categories=performance,accessibility --form-factor=mobile --screenEmulation.mobile=true --output=json --output-path="${out}" --chrome-flags="--headless --no-sandbox --disable-gpu" --quiet`,
      { stdio: "inherit", timeout: 120000 },
    );
    const r = JSON.parse(readFileSync(out, "utf8"));
    const row = {
      page: name,
      performance: Math.round((r.categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((r.categories.accessibility?.score ?? 0) * 100),
      lcp: r.audits["largest-contentful-paint"]?.displayValue ?? "n/a",
      cls: r.audits["cumulative-layout-shift"]?.displayValue ?? "n/a",
      inp: r.audits["interaction-to-next-paint"]?.displayValue ?? "n/a",
    };
    results.push(row);
    console.log(JSON.stringify(row));
  } catch (e) {
    console.error(`FAILED ${name}:`, e.message);
    results.push({ page: name, error: e.message });
  }
}

writeFileSync("reports/lh-baseline-summary.json", JSON.stringify(results, null, 2));
console.log("\n=== BASELINE SUMMARY ===");
console.table(results);
