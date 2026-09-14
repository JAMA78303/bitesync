import Anthropic from "@anthropic-ai/sdk";

let cached: { key: string; client: Anthropic } | null = null;

/**
 * One Anthropic client per key, reused across calls.
 *
 * Every call site used to construct its own, which means a fresh connection
 * pool per request — wasteful once Fill My Library runs several generations at
 * once, since none of them can reuse a warm connection.
 *
 * The timeout is the important part. The SDK defaults to **10 minutes**, and
 * pairing that with extra retries meant a rate-limited call could occupy a
 * worker for the better part of an hour: the fill appeared frozen partway
 * through while the retries kept spending. A recipe call that normally takes
 * ~10s has nothing useful to say at 45s, so fail it and let the engine fall
 * back to template steps — a slower recipe is worth less than a finished batch.
 *
 * maxRetries stays at the SDK default of 2 for the same reason. More retries
 * only help if the limit clears quickly; if it doesn't, they convert a fast
 * failure into a hang, which is the worse outcome of the two.
 */
export function anthropicClient(apiKey: string): Anthropic {
  if (cached?.key === apiKey) return cached.client;
  const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 45_000 });
  cached = { key: apiKey, client };
  return client;
}

/**
 * Request settings shared by every structured-output call — recipes, methods,
 * week plans. All of them want a JSON object back, not reasoning.
 *
 * Sonnet 5 runs adaptive thinking by default, at high effort. The model these
 * calls were written for did not think at all, so the switch (#36) silently
 * changed what max_tokens had to cover: thinking counts against it. With the
 * 900–2000 token caps in place, the model could spend the entire budget
 * reasoning and return no text block — which surfaced as "didn't return a
 * usable plan" and as recipe calls that quietly fell back to templates.
 *
 * Low effort keeps a little reasoning for constraint-heavy prompts (dedupe,
 * dietary rules) while making the output the bulk of the spend.
 */
export const STRUCTURED_OUTPUT_CONFIG = { effort: "low" } as const;

/**
 * Why a response carried no text. Logged at every call site so an exhausted
 * budget is named rather than reported as a generic null.
 */
export function describeEmptyResponse(response: {
  stop_reason: string | null;
  content: Array<{ type: string }>;
}): string {
  const blocks = response.content.map((b) => b.type).join(",") || "none";
  if (response.stop_reason === "max_tokens") {
    return `hit max_tokens before producing text (blocks: ${blocks}) — raise the cap or lower effort`;
  }
  return `no text block (stop_reason=${response.stop_reason ?? "null"}, blocks: ${blocks})`;
}
