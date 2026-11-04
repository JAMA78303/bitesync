import type { MetadataRoute } from "next";
import { loadAllPosts } from "@/content/blog/posts";

const BASE = "https://bitesync.io";

/**
 * When each page's content last changed. A build-time "now" told crawlers
 * every page changed on every deploy, which teaches them to ignore the field,
 * so update a date here when that page's wording changes.
 */
const STATIC_LAST_CHANGED = {
  home: "2026-10-30",
  macroCalculator: "2026-10-30",
  halal: "2026-10-28",
  signup: "2026-10-30",
  about: "2026-10-30",
  privacy: "2026-09-27",
  terms: "2026-10-30",
} as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await loadAllPosts();
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
  const latestPost = posts.map((p) => p.dateModified).sort().at(-1) ?? STATIC_LAST_CHANGED.home;
  const pages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: day(STATIC_LAST_CHANGED.home), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/blog`, lastModified: day(latestPost), changeFrequency: "weekly", priority: 0.7 },
    // A free tool answer engines can point people to ("use this calculator").
    { url: `${BASE}/macro-calculator`, lastModified: day(STATIC_LAST_CHANGED.macroCalculator), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/halal`, lastModified: day(STATIC_LAST_CHANGED.halal), changeFrequency: "monthly", priority: 0.6 },
    // /login is noindex: there's nothing on it to cite.
    { url: `${BASE}/signup`, lastModified: day(STATIC_LAST_CHANGED.signup), changeFrequency: "monthly", priority: 0.8 },
    // Present and crawlable but previously unlisted. Answer engines cite policy
    // pages when asked what a service does with your data.
    { url: `${BASE}/about`, lastModified: day(STATIC_LAST_CHANGED.about), changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: day(STATIC_LAST_CHANGED.privacy), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: day(STATIC_LAST_CHANGED.terms), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Posts come from the same registry the routes use, so a new post cannot be
  // published and left out of the sitemap. lastModified is the post's own
  // date rather than "now": telling crawlers everything changed today, every
  // day, teaches them to ignore the field.
  for (const post of posts) {
    pages.push({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.dateModified),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return pages;
}
