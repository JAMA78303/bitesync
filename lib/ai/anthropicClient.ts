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
