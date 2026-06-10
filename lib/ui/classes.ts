/** Shared Tailwind class groups — BiteSync design system */
export const ds = {
  /** Full-width mobile page shell — no negative margins (prevents edge bleed) */
  mobilePage:
    "min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--surface-page)]",
  pageContent: "pb-28 md:pb-0",
  /** Safe-area-aware horizontal padding for mobile */
  mobileGutter: "app-mobile-gutter",
  card: "rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-sm",
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
  sectionTitle: "text-base font-bold text-[var(--text-primary)]",
  cardTitle: "text-sm font-bold text-[var(--text-primary)]",
  cardSubtitle: "text-xs text-[var(--text-muted)]",
  label: "text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]",
  primaryBtn:
    "inline-flex items-center justify-center rounded-2xl bg-[var(--btn-primary-bg)] px-5 py-3 text-sm font-semibold text-[var(--btn-primary-text)] transition-colors hover:bg-[var(--btn-primary-hover)]",
  secondaryBtn:
    "inline-flex items-center justify-center rounded-2xl border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] px-5 py-3 text-sm font-semibold text-[var(--btn-secondary-text)] transition-colors hover:bg-[var(--btn-secondary-hover)]",
  input:
    "w-full rounded-2xl border border-[var(--border-default)] bg-[var(--surface-input)] px-4 py-3.5 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10",
  formCard:
    "space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm",
  /** Muted info / guidelines callout (Create Recipe, etc.) */
  infoCallout:
    "rounded-md border border-[var(--border-default)] bg-[var(--surface-info)] px-3 py-2 text-xs text-[var(--text-secondary)]",
  /** Optional grouped form block (diet labels, prefs) */
  formSection:
    "space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)]/80 p-3",
  formSectionLabel: "text-xs font-medium text-[var(--text-secondary)]",
  formSectionText: "text-sm text-[var(--text-secondary)]",
  /** Goal-matched draft panel on Create Recipe */
  goalDraftPanel:
    "space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-900/45 dark:bg-emerald-950/35",
  goalDraftLabel: "flex flex-col gap-1 text-xs text-emerald-900 dark:text-emerald-100",
  goalDraftSelect:
    "theme-aware-select h-9 min-w-[140px] rounded-md border border-emerald-200 px-2 text-sm dark:border-emerald-800",
  /** Header search on gradient backgrounds */
  headerSearchWrap:
    "flex items-center gap-2 rounded-2xl border border-[var(--surface-overlay)]/55 bg-[var(--surface-overlay)]/35 px-4 py-3 backdrop-blur-sm",
  overlap: "-mt-4",
  sectionGap: "mb-6",
  cardGap: "gap-3",
  thumbnail:
    "flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-brand-subtle)] text-2xl",
  /** @deprecated use mobilePage */
  page: "min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--surface-page)]",
} as const;
