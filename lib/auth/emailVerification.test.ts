import {
  friendlyConfirmationError,
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

console.log("emailVerification.test.ts: all assertions passed");
