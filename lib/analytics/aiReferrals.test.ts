import assert from "node:assert/strict";
import { identifyAiReferral } from "./aiReferrals";

const cases: Array<[string | null, string | null, string | null]> = [
  // [Referer, utm_source, expected assistant]
  ["https://chatgpt.com/", null, "ChatGPT"],
  [null, "chatgpt.com", "ChatGPT"],
  ["https://chat.openai.com/c/123", null, "ChatGPT"],
  ["https://www.perplexity.ai/", null, "Perplexity"],
  ["https://claude.ai/", null, "Claude"],
  ["https://gemini.google.com/", null, "Gemini"],
  ["https://copilot.microsoft.com/", null, "Copilot"],
  ["https://chat.deepseek.com/", null, "DeepSeek"],
  ["https://www.meta.ai/", null, "Meta AI"],
  ["https://grok.com/", null, "Grok"],
  // Not AI referrals.
  ["https://www.google.com/", null, null],
  ["https://www.bing.com/", null, null],
  ["https://bitesync.io/blog", null, null],
  ["https://m.facebook.com/", null, null],
  ["https://notchatgpt.com.example.org/", null, null],
  [null, "newsletter", null],
  ["not a url", null, null],
  [null, null, null],
];

for (const [referer, utm, expected] of cases) {
  const hit = identifyAiReferral(referer, utm);
  assert.equal(hit?.bot ?? null, expected, `referer=${referer} utm=${utm}`);
  if (hit) assert.equal(hit.kind, "referral");
}

console.log("aiReferrals tests passed");
