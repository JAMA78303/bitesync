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

type AuthLikeError = { message?: string; code?: string; status?: number };

/**
 * Supabase creates the user *before* it sends the confirmation email, so when
 * the send fails the account already exists. Telling that person to "check
 * your details and try again" (the old message) sent them round a loop: the
 * retry either resent the email a minute late or said the account already
 * existed. They need to hear that the account is made and the email is late.
 */
export function isConfirmationEmailSendError(error: AuthLikeError | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "over_email_send_rate_limit" || error.code === "email_address_not_authorized") return true;
  return /sending confirmation|send.*email|email rate limit|smtp/i.test(error.message ?? "");
}

/**
 * Signup failures the person can fix themselves, with Supabase's own wording
 * kept — "Password should be at least 8 characters" beats "check your details".
 */
export function signupErrorMessage(error: AuthLikeError): string | null {
  if (error.code === "weak_password") {
    return error.message || "That password is too weak — use at least 8 characters.";
  }
  if (error.code === "email_address_invalid" || /invalid.*email|email.*invalid/i.test(error.message ?? "")) {
    return "That email address doesn't look right — check it and try again.";
  }
  if (error.code === "over_request_rate_limit" || error.status === 429) {
    return "Too many attempts in a short time — wait a minute, then try again.";
  }
  if (error.code === "signup_disabled") {
    return "New sign-ups are paused right now. Please try again later.";
  }
  return null;
}

/**
 * The confirmation link came back with a ?code=, which Supabase only issues
 * after it has verified the email. If exchanging that code for a session then
 * fails — most often because the link was opened in a different browser or
 * email app from the one used to sign up, so the PKCE verifier cookie is not
 * there — the email is nonetheless confirmed. The person needs to log in, not
 * be told "we couldn't confirm your email" and sent to request a new link
 * that cannot help them.
 */
export const CONFIRMED_LOG_IN_MESSAGE = "Your email is confirmed. Log in to get started.";

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
