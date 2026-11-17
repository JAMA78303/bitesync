/**
 * Builds photo eval cases from Google's Nutrition5k dataset, for when there
 * are no weighed meals of our own to test with.
 *
 *   node --import tsx evals/photo-meals/nutrition5k.ts [--count 40]
 *
 * Needs the metadata files in evals/photo-meals/nutrition5k/ first (see
 * README.md). Picks whole plates from the official test split, downloads each
 * one's overhead photo (about 0.4 MB) and writes nutrition5k/cases.json for
 * run.ts:
 *
 *   node --env-file=.env.local --import tsx evals/photo-meals/run.ts --cases evals/photo-meals/nutrition5k/cases.json
 *
 * Nutrition5k: Thames et al., "Nutrition5k: Towards Automatic Nutritional
 * Understanding of Generic Food", CVPR 2021. Released under CC BY 4.0
 * (https://github.com/google-research-datasets/Nutrition5k). Every ingredient
 * was weighed; totals use USDA nutrient data.
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const BUCKET = "https://storage.googleapis.com/nutrition5k_dataset/nutrition5k_dataset";
const DIR = path.resolve("evals/photo-meals/nutrition5k");

/** A food has to be at least this heavy to count as one the AI should name. Salt, oil and herbs can't be seen. */
const VISIBLE_GRAMS = 20;

type Ingredient = { name: string; grams: number; kcal: number; protein: number };
type Dish = { id: string; time: number; kcal: number; mass: number; protein: number; ingredients: Ingredient[] };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function parseLine(line: string): Dish | null {
  const f = line.trim().split(",");
  if (!f[0]?.startsWith("dish_") || f.length < 13) return null;
  const ingredients: Ingredient[] = [];
  for (let i = 6; i + 6 < f.length; i += 7) {
    ingredients.push({ name: f[i + 1]!.trim(), grams: Number(f[i + 2]), kcal: Number(f[i + 3]), protein: Number(f[i + 6]) });
  }
  return {
    id: f[0],
    time: Number(f[0].slice(5)),
    kcal: Number(f[1]),
    mass: Number(f[2]),
    protein: Number(f[5]),
    ingredients,
  };
}

const ADJECTIVES = new Set([
  "fresh", "cooked", "roasted", "raw", "mixed", "green", "white", "brown", "black", "sweet", "baby",
  "grilled", "fried", "steamed", "boiled", "baked", "sauteed", "sliced", "diced", "dried", "plain",
  "whole", "wild", "small", "large", "with", "lean", "light", "dark",
]);

/** Words in a food's name that say nothing about which food it is. */
const FILLER = new Set(["the", "and", "with", "on", "of", "in"]);

/**
 * The dataset is American; the AI is asked for UK food-table names. A UK
 * name for the same food counts as naming it.
 */
const UK_NAMES: Record<string, string[]> = {
  arugula: ["rocket"],
  zucchini: ["courgette"],
  eggplant: ["aubergine"],
  cilantro: ["coriander"],
  scallion: ["spring onion"],
  garbanzo: ["chickpea"],
  green: ["salad", "leaves", "leaf", "lettuce"],
  greens: ["salad", "leaves", "leaf", "lettuce"],
  yam: ["sweet potato"],
  shrimp: ["prawn"],
  cookie: ["biscuit"],
  fry: ["chips"],
  fries: ["chips"],
  jello: ["jelly"],
  yogurt: ["yoghurt"],
};

/** Words that count as naming a food: its nouns, stemmed so "beans" matches "bean" and "berries" "berry". */
export function acceptWords(name: string): string[] {
  const words = name.toLowerCase().replace(/[^a-z ]+/g, " ").split(/\s+/);
  const stem = (w: string) =>
    w.endsWith("ies") ? w.slice(0, -3) : w.endsWith("oes") ? w.slice(0, -2) : w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;
  // "egg whites": "whites" is the colour, not a food, once stemmed.
  const nouns = words.filter((w) => w.length >= 3 && !ADJECTIVES.has(w) && !ADJECTIVES.has(stem(w)) && !FILLER.has(w));
  // "mixed greens" has no noun left once adjectives go; fall back to its words, minus filler.
  const fallback = words.filter((w) => w.length >= 3 && !FILLER.has(w));
  const accepted = (nouns.length ? nouns : fallback).flatMap((w) => [
    ...(FILLER.has(w) || w === "mixed" ? [] : [stem(w)]),
    ...(UK_NAMES[w] ?? UK_NAMES[stem(w)] ?? []),
  ]);
  return [...new Set(accepted)];
}

async function exists(url: string): Promise<boolean> {
  const res = await fetch(url, { method: "HEAD" });
  return res.ok;
}

async function main() {
  const count = Number(arg("count") ?? 40);
  const lines = [
    ...(await readFile(path.join(DIR, "dish_metadata_cafe1.csv"), "utf8")).split("\n"),
    ...(await readFile(path.join(DIR, "dish_metadata_cafe2.csv"), "utf8")).split("\n"),
  ];
  const testIds = new Set((await readFile(path.join(DIR, "rgb_test_ids.txt"), "utf8")).split(/\s+/).filter(Boolean));
  const dishes = lines.map(parseLine).filter((d): d is Dish => d !== null && testIds.has(d.id));

  // Plates were scanned as they were built up, one ingredient at a time, so
  // neighbouring scans are the same plate half-finished. Keep the fullest scan
  // of each plate: scans less than 15 minutes apart count as one plate.
  dishes.sort((a, b) => a.time - b.time);
  const plates: Dish[] = [];
  for (const d of dishes) {
    const last = plates.at(-1);
    if (last && d.time - last.time < 15 * 60) {
      if (d.mass > last.mass) plates[plates.length - 1] = d;
      continue;
    }
    plates.push(d);
  }

  // Real meals: a sensible size and energy density, at least two foods you can see.
  const meals = plates.filter((d) => {
    const visible = d.ingredients.filter((i) => i.grams >= VISIBLE_GRAMS).length;
    const density = d.kcal / Math.max(d.mass, 1);
    // Some ingredients are only labelled "deprecated": unnamed, so they can't be scored.
    if (d.ingredients.some((i) => /deprecated/i.test(i.name))) return false;
    return d.kcal >= 150 && d.kcal <= 1500 && d.mass >= 150 && density >= 0.3 && density <= 4 && visible >= 2;
  });
  console.log(`${dishes.length} test scans → ${plates.length} plates → ${meals.length} usable meals`);

  // Spread the picks across the whole collection period, for variety.
  const step = meals.length / count;
  const picked: Dish[] = [];
  for (let k = 0; k < meals.length && picked.length < count; k++) {
    const idx = Math.floor(k * step) % meals.length;
    for (let j = idx; j < meals.length; j++) {
      const d = meals[j]!;
      if (picked.includes(d)) continue;
      if (await exists(`${BUCKET}/imagery/realsense_overhead/${d.id}/rgb.png`)) {
        picked.push(d);
        break;
      }
    }
  }

  await mkdir(path.join(DIR, "photos"), { recursive: true });
  const cases = [];
  for (const d of picked) {
    const file = path.join(DIR, "photos", `${d.id}.png`);
    const have = await stat(file).then((s) => s.size > 0).catch(() => false);
    if (!have) {
      const res = await fetch(`${BUCKET}/imagery/realsense_overhead/${d.id}/rgb.png`);
      if (!res.ok) throw new Error(`${d.id}: photo download failed (${res.status})`);
      await writeFile(file, Buffer.from(await res.arrayBuffer()));
    }
    cases.push({
      id: d.id,
      photo: `photos/${d.id}.png`,
      kind: "nutrition5k",
      foods: d.ingredients
        .filter((i) => i.grams >= VISIBLE_GRAMS)
        .map((i) => ({ name: i.name, grams: Math.round(i.grams), accept: acceptWords(i.name) })),
      kcal: Math.round(d.kcal),
      protein: Math.round(d.protein * 10) / 10,
    });
  }
  await writeFile(path.join(DIR, "cases.json"), JSON.stringify(cases, null, 2));
  console.log(`Wrote ${cases.length} cases to ${path.relative(process.cwd(), path.join(DIR, "cases.json"))}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 2;
});
