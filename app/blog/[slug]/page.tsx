import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { JsonLd } from "@/components/shared/JsonLd";
import { FOUNDER, FOUNDER_BYLINE } from "@/lib/founder";
import { blogPostingSchema } from "@/lib/seo/structuredData";
import { isPostSlug, loadPost, POST_SLUGS } from "@/content/blog/posts";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POST_SLUGS.map((slug) => ({ slug }));
}

// Each post used to ship under the site-wide title and description, so a
// search result for a post read as the homepage. The page-level metadata is
// what an answer engine quotes as the source; it has to describe the post.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isPostSlug(slug)) return {};
  const { meta } = await loadPost(slug);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `https://bitesync.io/blog/${slug}` },
    openGraph: {
      type: "article",
      title: meta.title,
      description: meta.description,
      publishedTime: meta.datePublished,
      modifiedTime: meta.dateModified,
      url: `https://bitesync.io/blog/${slug}`,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  if (!isPostSlug(slug)) notFound();
  const { meta, Content } = await loadPost(slug);

  return (
    <div className="min-h-screen bg-[var(--surface-card)]">
      <JsonLd data={blogPostingSchema({ slug, ...meta })} />
      <header className="border-b border-[var(--border-subtle)] px-4 py-4">
        <Logo size="sm" href="/" />
      </header>
      <article className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm font-medium text-[var(--brand-primary)]">{meta.category}</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{meta.title}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          <time dateTime={meta.datePublished}>{formatDate(meta.datePublished)}</time>
          {meta.dateModified !== meta.datePublished ? (
            <>
              {" · Updated "}
              <time dateTime={meta.dateModified}>{formatDate(meta.dateModified)}</time>
            </>
          ) : null}
          {meta.reviewedBy === "founder" ? (
            <>
              {" · Reviewed by "}
              <Link href={FOUNDER.path} className="font-medium text-[var(--text-link)] hover:underline">
                {FOUNDER_BYLINE}
              </Link>
            </>
          ) : null}
        </p>
        <div className="mt-6">
          <Content />
        </div>
        <Link
          href="/signup"
          className="mt-10 inline-flex rounded-xl bg-[var(--btn-primary-bg)] px-5 py-2.5 text-sm font-medium text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
        >
          Try BiteSync free
        </Link>
        <p className="mt-6 flex gap-4">
          <Link href="/blog" className="text-sm text-[var(--text-muted)] hover:text-[var(--brand-primary)]">
            ← All posts
          </Link>
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--brand-primary)]">
            Home
          </Link>
        </p>
      </article>
    </div>
  );
}
