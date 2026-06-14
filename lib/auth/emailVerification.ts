/** True when Supabase has marked the user's email as confirmed. */
export function isEmailConfirmed(user: { email_confirmed_at?: string | null } | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at);
}

export function confirmationCallbackUrl(next = "/planner"): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function isEmailNotConfirmedAuthError(message: string): boolean {
  return /email not confirmed|confirm your email/i.test(message);
}

export function friendlyConfirmationError(message: string): string {
  const lower = message.toLowerCase();
  if (/expired|invalid.*otp|invalid.*link|already.*used/.test(lower)) {
    return "That confirmation link has expired or was already used. Request a new one below.";
  }
  return "We couldn't confirm your email. Request a new confirmation link below.";
}

export const VERIFY_EMAIL_PATH = "/verify-email";

/** Routes an unconfirmed signed-in user may still visit. */
export function isAllowedWithoutEmailConfirmation(path: string): boolean {
  if (path.startsWith(VERIFY_EMAIL_PATH)) return true;
  if (path.startsWith("/auth/callback")) return true;
  if (path.startsWith("/login") || path.startsWith("/signup")) return true;
  if (path.startsWith("/reset")) return true;
  if (path === "/" || path.startsWith("/privacy") || path.startsWith("/terms")) return true;
  if (path.startsWith("/blog")) return true;
  return false;
}
