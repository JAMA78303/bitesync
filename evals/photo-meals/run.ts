/**
 * Photo meal eval: runs the real pipeline (identifyMeal → matchFood → the
 * review screen's starting weights) on weighed meals and reports the four
 * numbers the spec sets as the bar for switching photo logging on.
 *
 *   node --env-file=.env.local --import tsx evals/photo-meals/run.ts
 *   node --env-file=.env.local --import tsx evals/photo-meals/run.ts --model claude-sonnet-5-5
 *   … --cases evals/photo-meals/cases.json --limit 5
 *
 * Every case is one paid API call. See README.md.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { lookupNutritionAsync } from "@/lib/nutrition/lookupAsync";
import { matchFood } from "@/lib/photoMeal/matchFood";
import { mealRange, startingGrams } from "@/lib/photoMeal/totals";
import type { ReviewItem } from "@/lib/photoMeal/types";
import { isNamed, median, TARGETS, type TrueFood } from "./score";

type Case = {
  id: string;
  /** Relative to the cases file. */
  photo: string;
  kind?: string;
  foods: TrueFood[];
  /** From packaging or a recipe app, when the food list can't express it exactly. */
  kcal?: number;
  protein?: number;
};

type CaseResult = {
  id: string;
  kind: string | null;
  outcome: "meal" | "not_food" | "failed";
  reason?: string;
  seconds: number;
  predicted: { name: string; low: number; high: number; matched: boolean }[];
  foodsTotal: number;
  foodsNamed: number;
  missed: string[];
  truth: { kcal: number; protein: number };
  estimate: { kcal: number; protein: number; kcalLow: number; kcalHigh: number } | null;
  energyError: number | null;
  proteinError: number | null;
  inRange: boolean | null;
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** List prices, $ per million tokens (input, output), standard API, prompts under 100K tokens. */
const PRICES: Record<string, [number, number]> = {
  "claude-opus-5-5": [4, 20],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
};

function costUsd(model: string, u: { inputTokens: number; outputTokens: number }): number | null {
  const price = PRICES[model];
  if (!price) return null;
  return (u.inputTokens * price[0] + u.outputTokens * price[1]) / 1_000_000;
}

async function truthFor(c: Case): Promise<{ kcal: number; protein: number; unmatched: string[] }> {
  let kcal = 0;
  let protein = 0;
  const unmatched: string[] = [];
  for (const f of c.foods) {
    const r = await lookupNutritionAsync(f.name, f.grams, "g", { skipAI: true });
    if (!r || r.estimated) {
      unmatched.push(f.name);
      continue;
    }
    kcal += r.kcal;
    protein += r.protein;
  }
  return { kcal: c.kcal ?? kcal, protein: c.protein ?? protein, unmatched };
}

/** The app sends a 1,024 px JPEG; the eval sends the same, so it measures what users get. */
async function loadPhoto(file: string): Promise<{ mediaType: "image/jpeg"; base64: string }> {
  const input = await readFile(file);
  try {
    const sharp = (await import("sharp")).default;
    const out = await sharp(input)
      .rotate()
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    return { mediaType: "image/jpeg", base64: out.toString("base64") };
  } catch (error) {
    throw new Error(`Couldn't read ${file} as an image (${(error as Error).message}). Use JPEG or PNG.`);
  }
}

async function main() {
  const model = arg("model");
  if (model) process.env.PHOTO_MEAL_MODEL = model;
  // Imported after PHOTO_MEAL_MODEL is set, because the module reads it on load.
  const { identifyMeal, PHOTO_MEAL_MODEL } = await import("@/lib/photoMeal/identify");

  const casesFile = path.resolve(arg("cases") ?? "evals/photo-meals/cases.json");
  const limit = Number(arg("limit") ?? Infinity);
  const cases = (JSON.parse(await readFile(casesFile, "utf8")) as Case[]).slice(0, limit);
  if (!cases.length) throw new Error(`No cases in ${casesFile}`);
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY isn't set (run with --env-file=.env.local).");

  const concurrency = Math.max(1, Number(arg("concurrency") ?? 4));
  console.log(`Photo meal eval: ${cases.length} cases, model ${PHOTO_MEAL_MODEL}, ${concurrency} at a time\n`);
  const usage = { inputTokens: 0, outputTokens: 0 };

  const runCase = async (c: Case): Promise<CaseResult> => {
    const truth = await truthFor(c);
    if (truth.unmatched.length && (c.kcal == null || c.protein == null)) {
      console.warn(`  ${c.id}: true foods with no nutrition match (${truth.unmatched.join(", ")}); add kcal/protein to the case or rename them.`);
    }
    const started = performance.now();
    const photo = await loadPhoto(path.resolve(path.dirname(casesFile), c.photo));
    const identified = await identifyMeal(photo, {
      onUsage: (u) => {
        usage.inputTokens += u.inputTokens;
        usage.outputTokens += u.outputTokens;
      },
    });
    const seconds = Math.round((performance.now() - started) / 100) / 10;

    const base = {
      id: c.id,
      kind: c.kind ?? null,
      seconds,
      foodsTotal: c.foods.length,
      truth: { kcal: Math.round(truth.kcal), protein: Math.round(truth.protein) },
    };

    if (identified.kind !== "meal") {
      console.log(`✗ ${c.id}: ${identified.kind}${identified.kind === "failed" ? ` (${identified.reason})` : ""}`);
      return {
        ...base,
        outcome: identified.kind,
        reason: identified.kind === "failed" ? identified.reason : undefined,
        predicted: [],
        foodsNamed: 0,
        missed: c.foods.map((f) => f.name),
        estimate: null,
        energyError: null,
        proteinError: null,
        inRange: null,
      };
    }

    const items: ReviewItem[] = await Promise.all(
      identified.foods.map(async (f, i) => ({
        key: `f${i}`,
        name: f.food,
        gramsLow: f.gramsLow,
        gramsHigh: f.gramsHigh,
        grams: startingGrams(f.gramsLow, f.gramsHigh),
        edited: false,
        match: await matchFood(f.food),
      })),
    );
    // Hidden extras start switched off on the review screen, so they're left out here too.
    const range = mealRange(items);
    const names = identified.foods.map((f) => f.food);
    const named = c.foods.filter((f) => isNamed(f, names));
    const energyError = truth.kcal > 0 ? Math.abs(range.current.kcal - truth.kcal) / truth.kcal : null;
    const proteinError = truth.protein > 0 ? Math.abs(range.current.protein - truth.protein) / truth.protein : null;
    const inRange = truth.kcal >= range.low.kcal * 0.995 && truth.kcal <= range.high.kcal * 1.005;

    const result: CaseResult = {
      ...base,
      outcome: "meal",
      predicted: items.map((i) => ({ name: i.name, low: i.gramsLow, high: i.gramsHigh, matched: Boolean(i.match) })),
      foodsNamed: named.length,
      missed: c.foods.filter((f) => !named.includes(f)).map((f) => f.name),
      estimate: {
        kcal: Math.round(range.current.kcal),
        protein: Math.round(range.current.protein),
        kcalLow: Math.round(range.low.kcal),
        kcalHigh: Math.round(range.high.kcal),
      },
      energyError,
      proteinError,
      inRange,
    };
    const pct = (n: number | null) => (n == null ? "–" : `${Math.round(n * 100)}%`);
    console.log(
      `${inRange ? "✓" : "·"} ${c.id}: ${named.length}/${c.foods.length} foods named, ` +
        `${Math.round(range.current.kcal)} kcal (${Math.round(range.low.kcal)}–${Math.round(range.high.kcal)}) vs ${Math.round(truth.kcal)}, ` +
        `energy ${pct(energyError)}, protein ${pct(proteinError)}, ${seconds}s` +
        (named.length < c.foods.length ? `; missed ${c.foods.filter((f) => !named.includes(f)).map((f) => f.name).join(", ")}` : ""),
    );
    return result;
  };

  // A few photos at a time; results keep the cases' order.
  const results: CaseResult[] = new Array(cases.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, cases.length) }, async () => {
      while (next < cases.length) {
        const i = next++;
        results[i] = await runCase(cases[i]!);
      }
    }),
  );

  const foodsTotal = results.reduce((n, r) => n + r.foodsTotal, 0);
  const foodsNamed = results.reduce((n, r) => n + r.foodsNamed, 0);
  // A failed or "not food" answer on a real meal is the worst outcome, so it counts as 100% off.
  const energyErrors = results.map((r) => r.energyError ?? 1);
  const proteinErrors = results.map((r) => r.proteinError ?? 1);
  const ranged = results.filter((r) => r.inRange).length;

  const summary = {
    model: PHOTO_MEAL_MODEL,
    cases: results.length,
    identification: foodsTotal ? foodsNamed / foodsTotal : 0,
    energyMedianError: median(energyErrors) ?? 1,
    proteinMedianError: median(proteinErrors) ?? 1,
    rangeCoverage: results.length ? ranged / results.length : 0,
    medianSeconds: median(results.map((r) => r.seconds)) ?? 0,
    failures: results.filter((r) => r.outcome !== "meal").length,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd: costUsd(PHOTO_MEAL_MODEL, usage),
  };
  const pass = {
    identification: summary.identification >= TARGETS.identification,
    energyMedianError: summary.energyMedianError <= TARGETS.energyMedianError,
    proteinMedianError: summary.proteinMedianError <= TARGETS.proteinMedianError,
    rangeCoverage: summary.rangeCoverage >= TARGETS.rangeCoverage,
  };

  const line = (label: string, value: string, target: string, ok: boolean) =>
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label.padEnd(26)} ${value.padStart(6)}   target ${target}`);
  const p = (n: number) => `${Math.round(n * 100)}%`;
  console.log(`\nSummary (${summary.cases} cases, ${summary.failures} with no result, median ${summary.medianSeconds}s per photo)`);
  line("Foods named correctly", p(summary.identification), "≥ 85%", pass.identification);
  line("Energy, median error", p(summary.energyMedianError), "≤ 20%", pass.energyMedianError);
  line("Protein, median error", p(summary.proteinMedianError), "≤ 20%", pass.proteinMedianError);
  line("True energy inside range", p(summary.rangeCoverage), "≥ 70%", pass.rangeCoverage);
  const allPass = Object.values(pass).every(Boolean);
  console.log(allPass ? "\nAll targets met." : "\nNot ready: at least one target missed.");
  if (results.length < 30) console.log(`Only ${results.length} cases: the spec asks for at least 30 before deciding.`);
  console.log(
    `Tokens: ${usage.inputTokens.toLocaleString("en-GB")} in, ${usage.outputTokens.toLocaleString("en-GB")} out` +
      (summary.costUsd != null
        ? ` ≈ $${summary.costUsd.toFixed(2)} (about $${(summary.costUsd / Math.max(results.length, 1)).toFixed(3)} a photo)`
        : " (no price on file for this model)"),
  );

  const outDir = path.resolve("evals/photo-meals/results");
  await mkdir(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = path.join(outDir, `${stamp}-${PHOTO_MEAL_MODEL}.json`);
  await writeFile(outFile, JSON.stringify({ summary, pass, targets: TARGETS, results }, null, 2));
  console.log(`\nSaved ${path.relative(process.cwd(), outFile)}`);
  process.exitCode = allPass ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 2;
});
