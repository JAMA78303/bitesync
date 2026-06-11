/**
 * Capture landing demo PNGs from /screenshot-capture into public/landing/.
 * Transparent background, frame shadow included, light + dark variants.
 *
 * Usage:
 *   npm run dev   # in another terminal (route 404s in production builds)
 *   npm run capture:landing
 *
 * Optional: BASE_URL=http://localhost:3000 npm run capture:landing
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "landing");
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const targets = ["planner", "grocery", "today"];

async function captureTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
  }, theme);
  // Transparent capture: must out-specify `html[data-theme] body { ... !important }` in globals.css.
  await page.addStyleTag({
    content:
      'html, body, html[data-theme="light"], html[data-theme="light"] body, html[data-theme="dark"], html[data-theme="dark"] body { background: transparent !important; }',
  });
  await new Promise((r) => setTimeout(r, 300));

  for (const id of targets) {
    const handle = await page.$(`[data-screenshot="${id}"]`);
    if (!handle) {
      console.warn(`Missing screenshot target: ${id}`);
      continue;
    }
    const png = await handle.screenshot({ type: "png", omitBackground: true });
    const suffix = theme === "dark" ? "-dark" : "";
    const file = path.join(outDir, `${id}${suffix}.png`);
    await writeFile(file, png);
    console.log(`Wrote ${file}`);
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.goto(`${baseUrl}/screenshot-capture`, { waitUntil: "networkidle0", timeout: 60_000 });

  await captureTheme(page, "light");
  await captureTheme(page, "dark");

  await browser.close();
  console.log("Landing screenshots captured.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
