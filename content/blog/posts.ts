import type { ComponentType } from "react";

export type PostMeta = {
  title: string;
  /** One or two sentences; becomes the meta description and the index blurb. */
  description: string;
  category: string;
  /** ISO date. Answer engines weight recency; keep dateModified honest. */
  datePublished: string;
  dateModified: string;
};

export type Post = PostMeta & { slug: string };

/**
 * Adding a post: create content/blog/<slug>.mdx with an exported `meta`, then
 * add the slug here. The route's static params, the sitemap and the index page
 * all derive from this list, so there is exactly one place a post can be
 * forgotten — and the type check catches a slug with no file behind it.
 */
export const POST_SLUGS = [
  "thermic-effect-of-protein",
  "meal-planning-reduce-food-waste",
] as const;

export type PostSlug = (typeof POST_SLUGS)[number];

export function isPostSlug(slug: string): slug is PostSlug {
  return (POST_SLUGS as readonly string[]).includes(slug);
}

export async function loadPost(
  slug: PostSlug,
): Promise<{ meta: PostMeta; Content: ComponentType }> {
  // The static "./" prefix and ".mdx" suffix let the bundler enumerate the
  // directory at build time; isPostSlug keeps the variable part closed.
  const mod = (await import(`./${slug}.mdx`)) as { meta: PostMeta; default: ComponentType };
  return { meta: mod.meta, Content: mod.default };
}

/** Every post, newest first. */
export async function loadAllPosts(): Promise<Post[]> {
  const posts = await Promise.all(
    POST_SLUGS.map(async (slug) => ({ slug, ...(await loadPost(slug)).meta })),
  );
  return posts.sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}
