/**
 * Halal waitlist (/halal): the choices on the form and sign-up validation.
 * Safe to import from client components; writes live in halalStore.ts.
 */

export const HALAL_WANTS = [
  { value: "photo", label: "Snap a meal, see the macros" },
  { value: "halal", label: "Halal ingredient checks" },
  { value: "plans", label: "Weekly halal meal plans" },
  { value: "ramadan", label: "Ramadan and fasting plans" },
] as const;

export type HalalWant = (typeof HALAL_WANTS)[number]["value"];

export type HalalSignup = { email: string; wants: HalalWant | null; ref: string | null };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The cleaned sign-up, or why it was rejected. `website` is a honeypot field bots fill in. */
export function parseHalalSignup(form: FormData): HalalSignup | { error: "invalid_email" | "bot" } {
  if (String(form.get("website") ?? "") !== "") return { error: "bot" };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return { error: "invalid_email" };
  const raw = String(form.get("wants") ?? "");
  const wants = HALAL_WANTS.find((w) => w.value === raw)?.value ?? null;
  return { email, wants, ref: cleanRef(String(form.get("ref") ?? "")) };
}

/** ?ref= from a video or creator link, kept short and safe to group by. */
export function cleanRef(ref: string | null | undefined): string | null {
  const v = (ref ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  return v || null;
}

/** Two-letter country from Vercel's edge header, or null. */
export function cleanCountry(code: string | null | undefined): string | null {
  return code && /^[A-Z]{2}$/.test(code) ? code : null;
}
