/** Type scale tokens — ≤7 sizes, ≤3 weights */
export const type = {
  micro: "text-2xs",
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
} as const;

/** Spacing scale — 4px base */
export const space = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  8: "8",
  10: "10",
  12: "12",
  16: "16",
} as const;

/** Border radii — ≤2 values */
export const radius = {
  md: "rounded-lg",
  lg: "rounded-2xl",
} as const;

/** Shared Tailwind class groups — BiteSync design system */
export const ds = {
  /** Full-width page wrapper. Transparent so the shell's background glow shows;
   *  the shell's <main> already clips sideways overflow. */
  mobilePage: "w-full max-w-full",
  pageContent: "pb-28 md:pb-0",
  /** Safe-area-aware horizontal padding for mobile */
  mobileGutter: "app-mobile-gutter",
  card: "rounded-[20px] border border-[var(--border-default)] bg-[var(--card-surface)] shadow-[var(--card-shadow)]",
  cardPadding: "p-4",
  /** Page header: a deep-green card with a lime glow (see .app-hero in globals.css). */
  gradientHeader: "app-hero",
  gradientHeaderCompact: "app-hero app-hero--compact",
  /** Small lime label above a page title. */
  kicker:
    "mb-2 block font-display text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent-lime)]",
  pageTitle:
    "font-display text-[26px] font-extrabold leading-[1.08] tracking-[-0.04em] text-[var(--text-on-header)] md:text-[30px]",
  pageSubtitle: "text-sm text-[var(--text-on-header-muted)]",
  /** The one main action on a page header. */
  heroPrimaryBtn:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent-lime)] px-4 text-sm font-semibold text-[var(--on-lime)] shadow-[0_8px_22px_rgba(0,0,0,0.14)] transition-[filter,transform] duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-60",
  /** Secondary actions on a page header. */
  heroGhostBtn:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-semibold text-[var(--text-on-header)] transition-colors duration-150 hover:border-white/50 hover:bg-white/15 active:scale-[0.98] disabled:opacity-60",
  headerStatCard: "rounded-2xl border border-white/10 bg-[var(--header-stat-bg)] p-3",
  headerStatLabel: "text-2xs text-[var(--text-on-header-subtle)]",
  headerStatValue: "text-base font-bold text-[var(--text-on-header)]",
  headerStatUnit: "text-xs font-normal text-[var(--text-on-header-muted)]",
  headerStatAccent: "text-[var(--header-stat-accent)]",
  headerStatWarn: "text-[var(--header-stat-warn)]",
  sectionTitle: "font-display text-lg font-extrabold tracking-[-0.02em] text-[var(--text-primary)]",
  /** Small green label above a section title. */
  sectionKicker:
    "mb-1 block font-display text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-primary)]",
  /** 3-tier typography — primary / secondary / metadata */
  tierPrimary: "text-base font-semibold text-[var(--text-primary)]",
  tierSecondary: "text-sm font-bold tabular-nums text-[var(--text-primary)]",
  tierMeta: "text-xs text-[var(--text-muted)]",
  statValue: "font-display text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--text-primary)]",
  statValueSm: "text-sm font-bold tabular-nums text-[var(--text-primary)]",
  statLabel: "text-xs text-[var(--text-muted)]",
  statUnit: "text-xs font-normal text-[var(--text-muted)]",
  cardTitle: "font-display text-base font-bold text-[var(--text-primary)]",
  cardSubtitle: "text-xs text-[var(--text-muted)]",
  label: "text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]",
  primaryBtn:
    "inline-flex items-center justify-center rounded-xl bg-[var(--btn-primary-bg)] px-5 py-3 text-sm font-semibold text-[var(--btn-primary-text)] shadow-[0_6px_16px_rgba(10,122,88,0.18)] transition-[background-color,transform] duration-150 hover:bg-[var(--btn-primary-hover)] active:scale-[0.98]",
  secondaryBtn:
    "inline-flex items-center justify-center rounded-xl border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] px-5 py-3 text-sm font-semibold text-[var(--btn-secondary-text)] transition-[background-color,transform] duration-150 hover:bg-[var(--btn-secondary-hover)] active:scale-[0.98]",
  input:
    "w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-input)] px-4 py-3.5 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--brand-action)] focus:ring-2 focus:ring-[var(--brand-action)]/10",
  formCard:
    "space-y-4 rounded-[20px] border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-[var(--card-shadow)]",
  /** Muted info / guidelines callout (Create Recipe, etc.) */
  infoCallout:
    "rounded-lg border border-[var(--border-default)] bg-[var(--surface-info)] px-3 py-2 text-xs text-[var(--text-secondary)]",
  /** Colour-only warn/success/error/info tokens — call sites add shape, padding, text size */
  warnCallout:
    "border border-[var(--semantic-warn-border)] bg-[var(--semantic-warn-bg)] text-[var(--semantic-warn-text)]",
  successCallout:
    "border border-[var(--semantic-success-border)] bg-[var(--semantic-success-bg)] text-[var(--semantic-success-text)]",
  errorCallout:
    "border border-[var(--semantic-error-border)] bg-[var(--semantic-error-bg)] text-[var(--semantic-error-text)]",
  infoTint:
    "border border-[var(--semantic-info-border)] bg-[var(--semantic-info-bg)] text-[var(--semantic-info-text)]",
  errorText: "text-[var(--semantic-error-text)]",
  estBadge:
    "rounded border border-[var(--semantic-warn-border)] bg-[var(--semantic-warn-bg)] text-xs text-[var(--semantic-warn-text)]",
  trafficGreen: "bg-[var(--traffic-green)]",
  trafficAmber: "bg-[var(--traffic-amber)]",
  trafficRed: "bg-[var(--traffic-red)]",
  /** Optional grouped form block (diet labels, prefs) */
  formSection:
    "space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)]/80 p-3",
  formSectionLabel: "text-xs font-medium text-[var(--text-secondary)]",
  formSectionText: "text-sm text-[var(--text-secondary)]",
  /** Goal-matched draft panel on Create Recipe */
  goalDraftPanel:
    "space-y-3 rounded-lg border border-[var(--semantic-success-border)] bg-[var(--semantic-success-bg)] p-3",
  goalDraftLabel: "flex flex-col gap-1 text-xs text-[var(--semantic-success-text)]",
  goalDraftSelect:
    "theme-aware-select h-9 min-w-[140px] rounded-lg border border-[var(--semantic-success-border)] px-2 text-sm",
  /** Header search on gradient backgrounds */
  headerSearchWrap:
    "flex items-center gap-2 rounded-2xl border border-[var(--surface-overlay)]/55 bg-[var(--surface-overlay)]/35 px-4 py-3 backdrop-blur-sm",
  /** Was a negative margin pulling content up over a full-bleed header; the
   *  header is now a card with its own bottom margin. */
  overlap: "",
  sectionGap: "mb-6",
  cardGap: "gap-3",
  thumbnail:
    "flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg",
  /** @deprecated use mobilePage */
  page: "min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--surface-page)]",
} as const;
