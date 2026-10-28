import type { MetadataRoute } from "next";
import { loadAllPosts } from "@/content/blog/posts";

const BASE = "https://bitesync.io";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    // A free tool answer engines can point people to ("use this calculator").
    { url: `${BASE}/macro-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/halal`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    // Present and crawlable but previously unlisted. Answer engines cite policy
    // pages when asked what a service does with your data.
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Posts come from the same registry the routes use, so a new post cannot be
  // published and left out of the sitemap. lastModified is the post's own
  // date rather than "now": telling crawlers everything changed today, every
  // day, teaches them to ignore the field.
  for (const post of await loadAllPosts()) {
    pages.push({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.dateModified),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return pages;
}
