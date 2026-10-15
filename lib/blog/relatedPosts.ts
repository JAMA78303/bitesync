/** The fields related-post picking needs; content/blog/posts.ts's Post fits. */
export type RelatedCandidate = { slug: string; category: string; datePublished: string };

export const RELATED_POST_COUNT = 3;
const SAME_CATEGORY_COUNT = 2;

/**
 * The posts to link at the end of `slug`: up to two from its own category,
 * then the next posts site-wide. Both walk the list in a fixed circular
 * order (newest first, ties by slug) starting just after the current post,
 * so every post is linked from the one before it and none is left with no
 * links pointing to it — the thing search engines need to find it.
 */
export function pickRelatedPosts<T extends RelatedCandidate>(posts: readonly T[], slug: string): T[] {
  const ordered = [...posts].sort(
    (a, b) => b.datePublished.localeCompare(a.datePublished) || a.slug.localeCompare(b.slug),
  );
  const at = ordered.findIndex((p) => p.slug === slug);
  if (at === -1) return [];
  const current = ordered[at];
  const after = [...ordered.slice(at + 1), ...ordered.slice(0, at)];

  const picked = after.filter((p) => p.category === current.category).slice(0, SAME_CATEGORY_COUNT);
  for (const p of after) {
    if (picked.length >= RELATED_POST_COUNT) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked;
}
