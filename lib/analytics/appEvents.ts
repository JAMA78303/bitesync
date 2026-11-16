/**
 * The product events BiteSync records in its own app_events table
 * (sql/2026-11-16_app_events.sql). Shared by the browser helpers in
 * events.ts and the /api/events route, so a name that isn't listed here is
 * dropped on both sides rather than stored.
 */
export const APP_EVENT_NAMES = [
  // First run and weekly planning
  "first_run_step_viewed",
  "first_run_completed",
  "first_run_skipped",
  "week_generated",
  "upcoming_week_planned",
  "reminder_offer",
  "install_offer",
  // Trial and upgrades
  "trial_started",
  "upgrade_prompt",
  "paywall_viewed",
  "purchase_started",
  "purchase_completed",
  "purchase_restored",
  // Snap a meal
  "photo_log_started",
  "photo_log_result",
  "photo_log_edited",
  "photo_log_saved",
  "photo_log_abandoned",
] as const;

export type AppEventName = (typeof APP_EVENT_NAMES)[number];

export type AppEventProps = Record<string, string | number | boolean | null>;

const NAMES = new Set<string>(APP_EVENT_NAMES);

export function isAppEventName(name: unknown): name is AppEventName {
  return typeof name === "string" && NAMES.has(name);
}

const MAX_PROPS = 8;
const MAX_KEY = 40;
const MAX_STRING = 80;

/**
 * Keep properties small and flat: at most 8, short keys, short strings,
 * finite numbers. Anything else is dropped rather than stored, so a caller
 * that passes the wrong thing can't fill the table.
 */
export function sanitizeEventProps(input: unknown): AppEventProps {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: AppEventProps = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_PROPS) break;
    if (!/^[a-z0-9_]{1,40}$/.test(key) || key.length > MAX_KEY) continue;
    if (typeof value === "string") out[key] = value.slice(0, MAX_STRING);
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean" || value === null) out[key] = value;
  }
  return out;
}
