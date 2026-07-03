/**
 * Capture landing demo PNGs from /screenshot-capture into public/landing/.
 * Protocol: 390px logical width, 2x DPR, light + dark, mobile layout.
 *
 * Usage:
 *   npm run dev   # in another terminal (route 404s in production builds)
 *   npm run capture:landing
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "landing");
const shotsMetaPath = path.join(root, "lib", "landing", "featurePreviewShots.ts");
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

const DEVICE_WIDTH = 390;
const DEVICE_DPR = 2;
const VIEWPORT_WIDTH = 400;
const VIEWPORT_HEIGHT = 320;

/** Keep in sync with `LANDING_FEATURE_SHOT_IDS` in lib/landing/featurePreviewShots.ts */
const targets = [
  "targets",
  "planner",
  "today",
  "nutrition",
  "ai-plans",
  "grocery",
  "import",
  "dietary",
  "micros",
];

function pngDimensions(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function captureTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
  }, theme);
  await page.addStyleTag({
    content:
      'html, body, html[data-theme="light"], html[data-theme="light"] body, html[data-theme="dark"], html[data-theme="dark"] body { background: transparent !important; }',
  });
  await new Promise((r) => setTimeout(r, 1200));

  const dimensions = {};

  for (const id of targets) {
    const handle = await page.$(`[data-screenshot="${id}"]`);
    if (!handle) {
      console.warn(`Missing screenshot target: ${id}`);
      continue;
    }
    await handle.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await new Promise((r) => setTimeout(r, 200));
    const png = await handle.screenshot({ type: "png", omitBackground: true });
    const suffix = theme === "dark" ? "-dark" : "";
    const file = path.join(outDir, `feature-${id}${suffix}.png`);
    await writeFile(file, png);
    if (theme === "light") {
      dimensions[id] = pngDimensions(Buffer.from(png));
    }
    console.log(`Wrote ${file} (${dimensions[id]?.width ?? "?"}×${dimensions[id]?.height ?? "?"})`);
  }

  return dimensions;
}

async function updateShotMetadata(dimensions) {
  let source = await readFile(shotsMetaPath, "utf8");
  for (const [id, { width, height }] of Object.entries(dimensions)) {
    const quotedId = id.includes("-") ? `"${id}"` : id;
    const block = new RegExp(
      `(${quotedId.replace(/-/g, "\\-")}:\\s*\\{[^}]*?width:\\s*)\\d+(,\\s*\\n\\s*height:\\s*)\\d+`,
      "s",
    );
    if (!block.test(source)) {
      console.warn(`Could not update dimensions for ${id} in featurePreviewShots.ts`);
      continue;
    }
    source = source.replace(block, `$1${width}$2${height}`);
  }
  await writeFile(shotsMetaPath, source);
  console.log("Updated lib/landing/featurePreviewShots.ts dimensions");
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    deviceScaleFactor: DEVICE_DPR,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(`${baseUrl}/screenshot-capture`, { waitUntil: "networkidle0", timeout: 120_000 });

  const dimensions = await captureTheme(page, "light");
  await captureTheme(page, "dark");

  await browser.close();

  if (Object.keys(dimensions).length === targets.length) {
    await updateShotMetadata(dimensions);
  }

  console.log("Landing screenshots captured.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
