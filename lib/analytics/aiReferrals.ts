import type { Crawler } from "@/lib/analytics/aiCrawlers";

/**
 * Recognises a person arriving from an AI assistant's answer — the referral
 * that matters for growth, as opposed to the bots in aiCrawlers.ts that read
 * pages. Two signals, either is enough:
 *  - the Referer is an assistant's site (chatgpt.com, perplexity.ai, …);
 *  - the link carries utm_source, which ChatGPT adds to links it cites
 *    (utm_source=chatgpt.com) even when the browser sends no Referer.
 *
 * Not covered: Google's AI Overviews and AI Mode, whose clicks arrive from
 * google.com like any other search result.
 */

const ASSISTANTS: { name: string; hosts: string[]; utm: string[] }[] = [
  { name: "ChatGPT", hosts: ["chatgpt.com", "chat.openai.com"], utm: ["chatgpt", "openai"] },
  { name: "Perplexity", hosts: ["perplexity.ai"], utm: ["perplexity"] },
  { name: "Claude", hosts: ["claude.ai"], utm: ["claude"] },
  { name: "Gemini", hosts: ["gemini.google.com", "bard.google.com"], utm: ["gemini"] },
  { name: "Copilot", hosts: ["copilot.microsoft.com", "copilot.cloud.microsoft"], utm: ["copilot"] },
  { name: "DeepSeek", hosts: ["chat.deepseek.com"], utm: ["deepseek"] },
  { name: "Meta AI", hosts: ["meta.ai"], utm: ["meta.ai"] },
  { name: "Grok", hosts: ["grok.com"], utm: ["grok"] },
  { name: "Mistral Le Chat", hosts: ["chat.mistral.ai"], utm: ["mistral"] },
  { name: "You.com", hosts: ["you.com"], utm: ["you.com"] },
  { name: "Phind", hosts: ["phind.com"], utm: ["phind"] },
  { name: "Poe", hosts: ["poe.com"], utm: ["poe.com"] },
];

function hostOf(referer: string): string | null {
  try {
    return new URL(referer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function matchesHost(host: string, candidate: string): boolean {
  return host === candidate || host.endsWith(`.${candidate}`);
}

export function identifyAiReferral(
  referer: string | null | undefined,
  utmSource: string | null | undefined,
): Crawler | null {
  const host = referer ? hostOf(referer) : null;
  const utm = utmSource?.toLowerCase().trim() ?? "";
  for (const a of ASSISTANTS) {
    if (host && a.hosts.some((h) => matchesHost(host, h))) return { bot: a.name, kind: "referral" };
    if (utm && a.utm.some((u) => utm.includes(u))) return { bot: a.name, kind: "referral" };
  }
  return null;
}
