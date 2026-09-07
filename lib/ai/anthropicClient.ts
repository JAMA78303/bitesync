import Anthropic from "@anthropic-ai/sdk";

let cached: { key: string; client: Anthropic } | null = null;

/**
 * One Anthropic client per key, reused across calls.
 *
 * Every call site used to construct its own, which means a fresh connection
 * pool per request — wasteful once Fill My Library runs several generations at
 * once, since none of them can reuse a warm connection.
 *
 * `maxRetries` is raised above the SDK default of 2 because that concurrency
 * makes brief 429s likelier, and an exhausted retry here is invisible: the
 * caller returns null and the engine quietly substitutes a template recipe.
 * Retrying a rate limit is much cheaper than silently shipping worse output.
 */
export function anthropicClient(apiKey: string): Anthropic {
  if (cached?.key === apiKey) return cached.client;
  const client = new Anthropic({ apiKey, maxRetries: 4 });
  cached = { key: apiKey, client };
  return client;
}
