import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { POST_SLUGS } from "../../content/blog/posts";
import { pickRelatedPosts, RELATED_POST_COUNT } from "./relatedPosts";

const post = (slug: string, category: string, datePublished: string) => ({ slug, category, datePublished });

// Two from the same category, then the next post site-wide.
const sample = [
  post("a", "Science", "2026-10-05"),
  post("b", "Comparisons", "2026-10-04"),
  post("c", "Science", "2026-10-03"),
  post("d", "Science", "2026-10-02"),
  post("e", "Shopping", "2026-10-01"),
];
assert.deepEqual(pickRelatedPosts(sample, "a").map((p) => p.slug), ["c", "d", "b"]);
// A post alone in its category still gets a full set.
assert.deepEqual(pickRelatedPosts(sample, "e").map((p) => p.slug), ["a", "b", "c"]);
// Never itself; unknown slugs get nothing.
assert.ok(!pickRelatedPosts(sample, "d").some((p) => p.slug === "d"));
assert.deepEqual(pickRelatedPosts(sample, "zzz"), []);

// The real posts: every post shows a full set, and every post is linked from
// at least one other post. MDX can't be imported here, so the two fields are
// read from each file's exported meta.
const field = (src: string, name: string) => src.match(new RegExp(`${name}:\\s*"([^"]+)"`))?.[1] ?? "";
const posts = POST_SLUGS.map((slug) => {
  const src = readFileSync(join(__dirname, "../../content/blog", `${slug}.mdx`), "utf8");
  return post(slug, field(src, "category"), field(src, "datePublished"));
});
assert.ok(posts.every((p) => p.category && p.datePublished), "every post has a category and date");
const linked = new Set<string>();
for (const p of posts) {
  const related = pickRelatedPosts(posts, p.slug);
  assert.equal(related.length, Math.min(RELATED_POST_COUNT, posts.length - 1), p.slug);
  related.forEach((r) => linked.add(r.slug));
}
for (const p of posts) assert.ok(linked.has(p.slug), `${p.slug} is linked from no other post`);

console.log("relatedPosts tests passed");
