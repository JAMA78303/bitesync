/** True when Supabase has marked the user's email as confirmed. */
export function isEmailConfirmed(user: { email_confirmed_at?: string | null } | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at);
}

/** User-safe copy when signup is attempted for an existing account. */
export const EXISTING_ACCOUNT_MESSAGE =
  "An account with this email already exists. Log in instead, or reset your password if you forgot it.";

type SignUpLikeUser = {
  identities?: { id: string }[] | null;
};

type SignUpLikeResponse = {
  user?: SignUpLikeUser | null;
  session?: unknown | null;
};

/** Supabase auth errors that mean the email is already registered. */
export function isAuthUserAlreadyRegisteredError(error: { message?: string } | null | undefined): boolean {
  const msg = (error?.message ?? "").toLowerCase();
  return /already registered|already exists|user already|email address is already/i.test(msg);
}

/**
 * With confirm-email enabled, Supabase returns success (no error) for existing
 * emails but omits identities — anti-enumeration behaviour we must handle.
 */
export function isDuplicateSignUpResponse(data: SignUpLikeResponse | null | undefined): boolean {
  const user = data?.user;
  if (!user) return false;
  if (Array.isArray(user.identities) && user.identities.length === 0) return true;
  return false;
}

export function confirmationCallbackUrl(next = "/onboarding"): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";
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
