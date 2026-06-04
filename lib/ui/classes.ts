/** Shared Tailwind class groups — BiteSync design system */
export const ds = {
  /** Full-width mobile page shell — no negative margins (prevents edge bleed) */
  mobilePage: "min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950",
  pageContent: "pb-28 md:pb-0",
  /** Safe-area-aware horizontal padding for mobile */
  mobileGutter: "app-mobile-gutter",
  card: "rounded-2xl border border-gray-100 bg-[var(--card-surface)] shadow-sm dark:border-gray-800",
  cardPadding: "p-4",
  gradientHeader:
    "bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)] app-mobile-gutter app-header-safe-top pb-8",
  gradientHeaderCompact:
    "bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)] app-mobile-gutter app-header-safe-top pb-6",
  pageTitle: "text-xl font-bold text-[var(--text-on-header)]",
  pageSubtitle: "text-sm text-[var(--text-on-header-muted)]",
  headerStatCard: "rounded-2xl bg-[var(--header-stat-bg)] p-3 backdrop-blur-sm",
  headerStatLabel: "text-[9px] text-[var(--text-on-header-subtle)]",
  headerStatValue: "text-base font-bold text-[var(--text-on-header)]",
  headerStatUnit: "text-xs font-normal text-[var(--text-on-header-muted)]",
  headerStatAccent: "text-[var(--header-stat-accent)]",
  headerStatWarn: "text-[var(--header-stat-warn)]",
  sectionTitle: "text-base font-bold text-gray-900 dark:text-white",
  cardTitle: "text-sm font-bold text-gray-900 dark:text-white",
  cardSubtitle: "text-xs text-gray-500 dark:text-gray-400",
  label: "text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500",
  primaryBtn:
    "inline-flex items-center justify-center rounded-2xl bg-[#3a5a40] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2d4a32] dark:bg-[#4a7a50] dark:hover:bg-[#3a5a40]",
  secondaryBtn:
    "inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300",
  input:
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition-all focus:border-[#3a5a40] focus:ring-2 focus:ring-[#3a5a40]/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white",
  overlap: "-mt-4",
  sectionGap: "mb-6",
  cardGap: "gap-3",
  thumbnail:
    "flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f0f7f0] text-2xl dark:bg-[#1a2e1d]",
  /** @deprecated use mobilePage */
  page: "min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950",
} as const;
