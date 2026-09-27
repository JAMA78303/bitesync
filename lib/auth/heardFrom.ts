/**
 * "How did you hear about BiteSync?" — one optional question at signup.
 *
 * The only way to tell whether a channel (TikTok, Reddit, an AI assistant)
 * brings people who stay. Referrer headers can't: TikTok and Instagram open
 * links in their own in-app browsers, which usually send none. The answer is
 * stored in the auth user's metadata (heard_from), so it needs no schema
 * change and is readable through the admin API.
 */
export const HEARD_FROM_OPTIONS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "reddit", label: "Reddit" },
  { value: "ai", label: "ChatGPT or another AI assistant" },
  { value: "search", label: "Google or another search engine" },
  { value: "friend", label: "A friend or family member" },
  { value: "other", label: "Somewhere else" },
] as const;

export type HeardFrom = (typeof HEARD_FROM_OPTIONS)[number]["value"];

const VALUES = new Set<string>(HEARD_FROM_OPTIONS.map((o) => o.value));

/** The submitted value if it is one we offer; anything else is dropped. */
export function parseHeardFrom(raw: FormDataEntryValue | null): HeardFrom | null {
  const v = typeof raw === "string" ? raw.trim() : "";
  return VALUES.has(v) ? (v as HeardFrom) : null;
}
