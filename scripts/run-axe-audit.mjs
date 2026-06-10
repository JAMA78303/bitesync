#!/usr/bin/env node
/**
 * Run axe-core in light and dark theme on key pages.
 * Usage: node scripts/run-axe-audit.mjs [baseUrl]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3456";
const pages = [
  { path: "/", name: "landing" },
  { path: "/planner", name: "planner" },
  { path: "/recipes", name: "recipes" },
  { path: "/nutrition", name: "nutrition" },
  { path: "/grocery", name: "grocery" },
];

const themes = ["light", "dark"];

async function main() {
  const puppeteer = await import("puppeteer");
  const { default: AxePuppeteer } = await import("@axe-core/puppeteer");

  mkdirSync("reports", { recursive: true });
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const summary = [];

  for (const theme of themes) {
    for (const { path, name } of pages) {
      const url = `${BASE}${path}`;
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, isMobile: true });
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      await page.evaluate((t) => {
        document.documentElement.setAttribute("data-theme", t);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(t);
        document.documentElement.style.colorScheme = t;
        try {
          localStorage.setItem("theme", t);
        } catch {}
      }, theme);

      const results = await new AxePuppeteer(page)
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();

      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      const row = {
        page: name,
        theme,
        violations: results.violations.length,
        serious: serious.length,
        items: serious.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
        })),
      };
      summary.push(row);
      const out = join("reports", `axe-baseline-${name}-${theme}.json`);
      writeFileSync(out, JSON.stringify(results, null, 2));
      console.log(`${name} (${theme}): ${serious.length} serious/critical, ${results.violations.length} total`);
      await page.close();
    }
  }

  await browser.close();
  writeFileSync("reports/axe-baseline-summary.json", JSON.stringify(summary, null, 2));
  console.log("\n=== AXE BASELINE ===");
  console.table(summary.map((r) => ({ page: r.page, theme: r.theme, serious: r.serious, total: r.violations })));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
