/** Short, user-safe error messages — never expose DB/SQL/stack details. */

const TECHNICAL_PATTERNS = [
  /duplicate key/i,
  /unique constraint/i,
  /violates unique/i,
  /postgres/i,
  /supabase/i,
  /pgrst/i,
  /relation .+ does not exist/i,
  /column .+ does not exist/i,
  /syntax error/i,
  /permission denied/i,
  /jwt/i,
  /row-level security/i,
  /23505/,
  /42p01/,
  /42501/,
];

export type UserFacingErrorContext =
  | "week-plan"
  | "grocery"
  | "recipe-import"
  | "recipe-save"
  | "recipe-generate"
  | "billing"
  | "profile"
  | "pantry"
  | "auth"
  | "generic";

export const FRIENDLY_BY_CONTEXT: Record<UserFacingErrorContext, string> = {
  "week-plan":
    "Couldn't generate your week plan — please try again. If this keeps happening, refresh the page and try once more.",
  grocery: "Couldn't update your grocery list — please try again.",
  "recipe-import": "Couldn't import that recipe — please check the URL and try again.",
  "recipe-save": "Couldn't save your recipe — please try again.",
  "recipe-generate": "Couldn't generate that recipe — please try again.",
  billing: "Couldn't complete billing — please try again or contact support.",
  profile: "Couldn't save your settings — please try again.",
  pantry: "Couldn't update your pantry — please try again.",
  auth: "Couldn't complete that — please check your details and try again.",
  generic: "Something went wrong — please try again.",
};

function looksTechnical(message: string): boolean {
  const m = message.trim();
  if (!m) return false;
  if (m.includes("\n") || m.includes(" at ") || m.includes("Error:")) return true;
  if (TECHNICAL_PATTERNS.some((re) => re.test(m))) return true;
  if (/^[A-Z_]+:/.test(m)) return true;
  return false;
}

/** Map a server/DB error to a safe user-visible string; log technical detail server-side. */
export function toUserFacingError(
  technical: unknown,
  context: UserFacingErrorContext,
  logLabel?: string,
): string {
  const message = technical instanceof Error ? technical.message : String(technical ?? "");
  if (logLabel) {
    console.error(`[${logLabel}]`, technical);
  }
  if (!looksTechnical(message)) {
    return message || FRIENDLY_BY_CONTEXT[context];
  }
  return FRIENDLY_BY_CONTEXT[context];
}

/** Branded fallback for unexpected render/runtime failures. */
export const BRANDED_ERROR_TITLE = "Something went wrong";
export const BRANDED_ERROR_MESSAGE =
  "BiteSync hit an unexpected problem. Refresh the page to try again.";
