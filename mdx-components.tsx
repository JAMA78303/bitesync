import type { MDXComponents } from "mdx/types";
import Link from "next/link";

/**
 * Required by @next/mdx in the App Router: maps markdown elements to styled
 * components. Every post inherits these, so the typography lives in one place
 * and a post author never writes a className.
 *
 * Colours use the theme tokens (guarded in CI) so posts render correctly in
 * dark mode without per-post effort.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children }) => (
      <h2 className="mt-10 text-2xl font-bold text-[var(--text-primary)]">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 text-xl font-semibold text-[var(--text-primary)]">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mt-4 list-disc space-y-2 pl-6 text-[var(--text-secondary)]">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-[var(--text-secondary)]">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
    ),
    a: ({ href, children }) => {
      const to = href ?? "#";
      const internal = to.startsWith("/");
      return internal ? (
        <Link href={to} className="text-[var(--text-link)] underline underline-offset-2">
          {children}
        </Link>
      ) : (
        <a
          href={to}
          className="text-[var(--text-link)] underline underline-offset-2"
          rel="noopener noreferrer"
          target="_blank"
        >
          {children}
        </a>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="mt-4 border-l-4 border-[var(--brand-primary)] pl-4 italic text-[var(--text-muted)]">
        {children}
      </blockquote>
    ),
    // Comparison tables are the point of comparison posts; give them a
    // scroll container so a wide one never scrolls the whole page sideways.
    table: ({ children }) => (
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-[var(--border-default)] px-3 py-2 text-left font-semibold text-[var(--text-primary)]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-[var(--border-subtle)] px-3 py-2 align-top text-[var(--text-secondary)]">
        {children}
      </td>
    ),
    ...components,
  };
}
