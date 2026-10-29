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

import { TRIAL_DAYS } from "@/lib/billing/access";
import { FOUNDER } from "@/lib/founder";

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
      founder: founderPersonSchema(),
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
    // No free plan for new accounts: the trial is how Pro starts, so it rides
    // on the Pro offers rather than being a £0 offer of its own.
    offers: [
      {
        "@type": "Offer",
        name: "Pro monthly",
        price: PRO_MONTHLY_AMOUNT,
        priceCurrency: PRICE_CURRENCY,
        description:
          "All macros, micronutrient analysis, and AI weekly plans. " +
          `Starts with a ${TRIAL_DAYS}-day free trial, no card needed.`,
      },
      {
        "@type": "Offer",
        name: "Pro annual",
        price: PRO_ANNUAL_AMOUNT,
        priceCurrency: PRICE_CURRENCY,
        description:
          "All macros, micronutrient analysis, and AI weekly plans, billed yearly. " +
          `Starts with a ${TRIAL_DAYS}-day free trial, no card needed.`,
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
  reviewedBy?: "founder";
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
    // reviewedBy is a WebPage property, so it rides on the page node rather
    // than the BlogPosting itself.
    ...(post.reviewedBy === "founder"
      ? {
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${BASE}/blog/${post.slug}`,
            reviewedBy: founderPersonSchema(),
          },
        }
      : {}),
  };
}

/** The founder as a schema.org Person, linked to the page that explains who they are. */
export function founderPersonSchema() {
  return {
    "@type": "Person",
    name: FOUNDER.name,
    jobTitle: FOUNDER.credential,
    url: `${BASE}${FOUNDER.path}`,
    worksFor: { "@type": "Organization", name: "BiteSync", url: BASE },
  };
}

export function aboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${BASE}${FOUNDER.path}`,
    name: "Why I built BiteSync",
    mainEntity: founderPersonSchema(),
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
