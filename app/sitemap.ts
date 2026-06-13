import type { MetadataRoute } from "next";

const BASE = "https://bitesync.io";

const BLOG_SLUGS = [
  "thermic-effect-of-protein",
  "meal-planning-reduce-food-waste",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  for (const slug of BLOG_SLUGS) {
    pages.push({
      url: `${BASE}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return pages;
}
