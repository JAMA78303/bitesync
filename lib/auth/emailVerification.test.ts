import {
  EXISTING_ACCOUNT_MESSAGE,
  friendlyConfirmationError,
  isAuthUserAlreadyRegisteredError,
  isDuplicateSignUpResponse,
  isEmailConfirmed,
  isEmailNotConfirmedAuthError,
  isAllowedWithoutEmailConfirmation,
  isConfirmationEmailSendError,
  signupErrorMessage,
} from "@/lib/auth/emailVerification";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(isEmailConfirmed({ email_confirmed_at: "2026-01-01" }), "confirmed user");
assert(!isEmailConfirmed({ email_confirmed_at: null }), "unconfirmed user");
assert(isEmailNotConfirmedAuthError("Email not confirmed"), "not confirmed error");
assert(
  friendlyConfirmationError("OTP expired").includes("expired"),
  "friendly expired message",
);
assert(isAllowedWithoutEmailConfirmation("/verify-email"), "verify path allowed");
assert(!isAllowedWithoutEmailConfirmation("/planner"), "planner blocked");
assert(
  isDuplicateSignUpResponse({ user: { identities: [] }, session: null }),
  "empty identities means existing account",
);
assert(
  !isDuplicateSignUpResponse({ user: { identities: [{ id: "x" }] }, session: null }),
  "new signup has identities",
);
assert(isAuthUserAlreadyRegisteredError({ message: "User already registered" }), "already registered error");
assert(!isAuthUserAlreadyRegisteredError({ message: "Invalid login credentials" }), "login error is not duplicate");
assert(EXISTING_ACCOUNT_MESSAGE.includes("Log in"), "existing account message points to login");

// --- signup errors: the account-exists-but-email-failed case must be recognised ---
{
  const sendFails = [
    { code: "over_email_send_rate_limit", status: 429, message: "email rate limit exceeded" },
    { code: "unexpected_failure", status: 500, message: "Error sending confirmation email" },
    { code: "email_address_not_authorized", status: 400, message: "Email address not authorized" },
  ];
  for (const e of sendFails) {
    if (!isConfirmationEmailSendError(e)) throw new Error(`should be an email-send error: ${e.message}`);
  }
  if (isConfirmationEmailSendError({ code: "weak_password", message: "Password should be at least 8 characters." })) {
    throw new Error("a weak password is not an email-send error");
  }
  if (isConfirmationEmailSendError(null)) throw new Error("null is not an error");

  const weak = signupErrorMessage({ code: "weak_password", message: "Password should be at least 8 characters." });
  if (weak !== "Password should be at least 8 characters.") throw new Error(`weak password keeps Supabase's wording, got ${weak}`);
  if (!signupErrorMessage({ code: "email_address_invalid", message: "Email address is invalid" })?.includes("doesn't look right")) {
    throw new Error("invalid email message");
  }
  if (!signupErrorMessage({ code: "over_request_rate_limit", status: 429, message: "x" })?.includes("wait a minute")) {
    throw new Error("rate limit message");
  }
  if (signupErrorMessage({ code: "unexpected_failure", status: 500, message: "boom" }) !== null) {
    throw new Error("unknown errors fall through to the generic message");
  }
}

console.log("emailVerification.test.ts: all assertions passed");
