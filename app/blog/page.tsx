import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { loadAllPosts } from "@/content/blog/posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Nutrition science, meal planning and macro tracking from BiteSync — written by a registered dietitian.",
  alternates: { canonical: "https://bitesync.io/blog" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * There was no index: posts were reachable only from the landing page's blog
 * strip and by direct URL. A crawler following links from the homepage found
 * whichever posts happened to be featured there and nothing else.
 */
export default async function BlogIndexPage() {
  const posts = await loadAllPosts();

  return (
    <div className="min-h-screen bg-[var(--surface-card)]">
      <header className="border-b border-[var(--border-subtle)] px-4 py-4">
        <Logo size="sm" href="/" />
      </header>
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Blog</h1>
        <p className="mt-2 text-base text-[var(--text-secondary)]">
          Nutrition science and meal planning, without the noise.
        </p>
        <ul className="mt-10 space-y-8">
          {posts.map((post) => (
            <li key={post.slug}>
              <article>
                <p className="text-xs font-medium text-[var(--brand-primary)]">{post.category}</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
                  <Link href={`/blog/${post.slug}`} className="hover:text-[var(--brand-primary)]">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {post.description}
                </p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
                </p>
              </article>
            </li>
          ))}
        </ul>
        <p className="mt-12">
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--brand-primary)]">
            ← Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
