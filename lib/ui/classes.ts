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
  formCard:
    "space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900",
  /** Muted info / guidelines callout (Create Recipe, etc.) */
  infoCallout:
    "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-gray-700 dark:bg-gray-800/85 dark:text-gray-300",
  /** Optional grouped form block (diet labels, prefs) */
  formSection:
    "space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-gray-700 dark:bg-gray-800/85",
  formSectionLabel: "text-xs font-medium text-slate-600 dark:text-gray-300",
  formSectionText: "text-sm text-slate-700 dark:text-gray-200",
  /** Goal-matched draft panel on Create Recipe */
  goalDraftPanel:
    "space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-900/45 dark:bg-emerald-950/35",
  goalDraftLabel: "flex flex-col gap-1 text-xs text-emerald-900 dark:text-emerald-100",
  goalDraftSelect:
    "theme-aware-select h-9 min-w-[140px] rounded-md border border-emerald-200 bg-white px-2 text-sm text-slate-900 dark:border-emerald-800 dark:bg-gray-900 dark:text-gray-100",
  /** Header search on gradient backgrounds — keep light-on-green styling in dark mode */
  headerSearchWrap:
    "flex items-center gap-2 rounded-2xl border border-white/55 bg-white/35 px-4 py-3 backdrop-blur-sm dark:border-white/25 dark:bg-black/25",
  overlap: "-mt-4",
  sectionGap: "mb-6",
  cardGap: "gap-3",
  thumbnail:
    "flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f0f7f0] text-2xl dark:bg-[#1a2e1d]",
  /** @deprecated use mobilePage */
  page: "min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950",
} as const;
