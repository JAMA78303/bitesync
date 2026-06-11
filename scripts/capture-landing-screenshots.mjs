/**
 * Capture landing demo PNGs from /screenshot-capture into public/landing/.
 *
 * Usage:
 *   npm run dev   # in another terminal
 *   node scripts/capture-landing-screenshots.mjs
 *
 * Optional: BASE_URL=http://localhost:3000 node scripts/capture-landing-screenshots.mjs
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

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.goto(`${baseUrl}/screenshot-capture`, { waitUntil: "networkidle0", timeout: 60_000 });

  for (const id of targets) {
    const handle = await page.$(`[data-screenshot="${id}"]`);
    if (!handle) {
      console.warn(`Missing screenshot target: ${id}`);
      continue;
    }
    const png = await handle.screenshot({ type: "png" });
    const file = path.join(outDir, `${id}.png`);
    await writeFile(file, png);
    console.log(`Wrote ${file}`);
  }

  await browser.close();
  console.log("Landing screenshots captured.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
