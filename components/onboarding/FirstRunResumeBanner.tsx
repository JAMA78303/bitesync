"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  show: boolean;
  step: number;
};

export function FirstRunResumeBanner({ show, step }: Props) {
  const pathname = usePathname() ?? "";

  if (!show || pathname.startsWith("/onboarding") || pathname.startsWith("/sample-week")) {
    return null;
  }

  return (
    <div className="border-b border-[var(--brand-primary)]/20 bg-[var(--surface-brand-subtle)] px-4 py-3 md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">Finish setup</span> — step {Math.min(step, 3)}{" "}
          of 3 to get your first planned week and grocery list.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--btn-primary-text)]"
        >
          Continue setup
        </Link>
      </div>
    </div>
  );
}
