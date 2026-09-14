import {
  PRICE_CURRENCY,
  PRO_ANNUAL_AMOUNT,
  PRO_MONTHLY_AMOUNT,
} from "@/lib/stripe/pricing";

/**
 * JSON-LD for the public site.
 *
 * Answer engines (ChatGPT search, Perplexity, Google AI Overviews) read a page
 * under time pressure and quote what they can attribute confidently. Prose has
 * to be parsed and inferred; JSON-LD states the same facts unambiguously —
 * what this is, what it costs, who made it, what it answers.
 *
 * This does not influence a model's *training* data, which is the other half of
 * being recommended and is earned off-site. It makes the site legible to the
 * retrieval half, which is the half that can be engineered.
 */

const BASE = "https://bitesync.io";

/** Facts stated on the page. Nothing here may claim more than the page shows. */
export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "BiteSync",
    url: BASE,
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Meal planning",
    operatingSystem: "Web browser (iOS, Android, desktop)",
    description:
      "Weekly meal planner that builds a week to your calorie and macro targets, " +
      "calculates nutrition from your ingredients, and generates one merged grocery " +
      "list. Includes micronutrient analysis against published dietary reference values.",
    creator: {
      "@type": "Organization",
      name: "BiteSync",
      url: BASE,
      // A named person with a verifiable registration would be materially
      // stronger here than an organisation — see the note in the PR.
      employee: {
        "@type": "Person",
        jobTitle: "Registered Dietitian",
      },
    },
    featureList: [
      "TDEE-based calorie and protein targets",
      "Weekly meal planner with running daily totals",
      "Automatic nutrition from ingredients",
      "Pantry-aware merged grocery list",
      "Recipe import from URL",
      "Micronutrient analysis against dietary reference values",
      "Vegetarian, vegan and gluten-free planning",
    ],
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: 0,
        priceCurrency: PRICE_CURRENCY,
        description: "Calories and protein per meal, up to 10 recipes.",
      },
      {
        "@type": "Offer",
        name: "Pro monthly",
        price: PRO_MONTHLY_AMOUNT,
        priceCurrency: PRICE_CURRENCY,
        description: "All macros, micronutrient analysis, and AI weekly plans.",
      },
      {
        "@type": "Offer",
        name: "Pro annual",
        price: PRO_ANNUAL_AMOUNT,
        priceCurrency: PRICE_CURRENCY,
        description: "All macros, micronutrient analysis, and AI weekly plans, billed yearly.",
      },
    ],
  };
}

export function blogPostingSchema(post: {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    url: `${BASE}/blog/${post.slug}`,
    mainEntityOfPage: `${BASE}/blog/${post.slug}`,
    author: { "@type": "Organization", name: "BiteSync", url: BASE },
    publisher: { "@type": "Organization", name: "BiteSync", url: BASE },
  };
}

export function faqPageSchema(items: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
