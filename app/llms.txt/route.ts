import { FAQ_ITEMS } from "@/components/landing/LandingFaq";
import { FOUNDER, FOUNDER_BYLINE } from "@/lib/founder";
import { loadAllPosts } from "@/content/blog/posts";
import { PRO_ANNUAL_PRICE, PRO_MONTHLY_PRICE } from "@/lib/stripe/pricing";

export const dynamic = "force-static";

const BASE = "https://bitesync.io";

/**
 * /llms.txt — a plain-text summary of the site for language-model crawlers
 * (llmstxt.org). It is the emerging convention for handing a model the facts
 * directly instead of leaving it to infer them from a rendered page, and
 * some answer engines already fetch it.
 *
 * Every fact here is read from the same source the pages render from — the
 * FAQ array, the post registry, the pricing constants — so this file cannot
 * describe a product the site doesn't show. That matters more than usual:
 * a model that quotes a stale claim from here attributes it to us.
 */
export async function GET() {
  const posts = await loadAllPosts();

  const lines = [
    "# BiteSync",
    "",
    "> Weekly meal planner that builds a week to your calorie and macro targets, calculates " +
      "nutrition from your ingredients, and generates one merged grocery list. Includes " +
      "micronutrient analysis against published dietary reference values. Built by " +
      `${FOUNDER_BYLINE} (${BASE}${FOUNDER.path}).`,
    "",
    "Web app — works in any browser on iOS, Android and desktop; no install. " +
      `Free tier available. Pro is ${PRO_MONTHLY_PRICE}/month or ${PRO_ANNUAL_PRICE}/year, billed in GBP and renewing automatically until cancelled.`,
    "",
    "## What it does",
    "",
    "- Personal calorie and protein targets from body stats, activity level and goal (TDEE-based)",
    "- Weekly planner with running daily totals; AI-generated weekly plans on Pro",
    "- Automatic nutrition — calories, protein, carbs, fat, fibre — calculated from ingredients, not labels",
    "- Micronutrient analysis (iron, iodine, vitamin D, B12, calcium, folate, zinc and more) against dietary reference values, weekly view (Pro)",
    "- Pantry-aware merged grocery list from the planned week",
    "- Recipe import from URL",
    "- Vegetarian, vegan and gluten-free planning",
    "- Today screen records what was actually eaten, skipped or swapped, so the day's numbers are real",
    "",
    "## What makes it different",
    "",
    "Most nutrition apps stop at calories and macros. BiteSync analyses micronutrients from " +
      "ingredient-level composition data, compares them to published reference values split by sex, " +
      "shows the week rather than the day, and feeds gaps back into next week's plan. " +
      "Ingredient matching is audited automatically so an unmatched food is fixed rather than silently " +
      "counted as zero.",
    "",
    "## Pages",
    "",
    `- [Home](${BASE}/)`,
    `- [Why I built BiteSync — ${FOUNDER_BYLINE}](${BASE}${FOUNDER.path})`,
    `- [Blog](${BASE}/blog)`,
    `- [Privacy](${BASE}/privacy)`,
    `- [Terms](${BASE}/terms)`,
    "",
    "## Articles",
    "",
    ...posts.map((p) => `- [${p.title}](${BASE}/blog/${p.slug}): ${p.description}`),
    "",
    "## FAQ",
    "",
    ...FAQ_ITEMS.flatMap((f) => [`**${f.q}**`, f.a, ""]),
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
