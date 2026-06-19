import {
  EXISTING_ACCOUNT_MESSAGE,
  friendlyConfirmationError,
  isAuthUserAlreadyRegisteredError,
  isDuplicateSignUpResponse,
  isEmailConfirmed,
  isEmailNotConfirmedAuthError,
  isAllowedWithoutEmailConfirmation,
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

console.log("emailVerification.test.ts: all assertions passed");
