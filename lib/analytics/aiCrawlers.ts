/**
 * Recognises AI assistants, search engines and link-preview bots from their
 * User-Agent, so proxy.ts can record when they read a page.
 *
 * The signal that matters most is kind "user": ChatGPT-User, Perplexity-User
 * and the like fetch a page only because a person has just asked that AI a
 * question and it decided to read BiteSync to answer. A "search" visit means
 * the page is being indexed so it can appear in answers later; "training"
 * collects pages for model training; "preview" means someone pasted a link
 * into a post or chat.
 *
 * Tokens are the ones each company publishes. A User-Agent can be faked, so
 * these are claims, not proof — fine for spotting a trend on a small site.
 */

/** "referral" is a person, not a bot: someone who clicked through from an AI
 *  assistant's answer (see aiReferrals.ts). It shares the table and page. */
export type CrawlerKind = "referral" | "user" | "search" | "training" | "preview";

export type Crawler = { bot: string; kind: CrawlerKind };

type CrawlerRule = Crawler & { token: string };

// Checked in order; first match wins. Tokens are matched case-insensitively.
const RULES: CrawlerRule[] = [
  { token: "ChatGPT-User", bot: "ChatGPT", kind: "user" },
  { token: "OAI-SearchBot", bot: "ChatGPT search", kind: "search" },
  { token: "GPTBot", bot: "OpenAI training", kind: "training" },
  { token: "Perplexity-User", bot: "Perplexity", kind: "user" },
  { token: "PerplexityBot", bot: "Perplexity search", kind: "search" },
  { token: "Claude-User", bot: "Claude", kind: "user" },
  { token: "Claude-SearchBot", bot: "Claude search", kind: "search" },
  { token: "ClaudeBot", bot: "Anthropic training", kind: "training" },
  { token: "meta-externalfetcher", bot: "Meta AI", kind: "user" },
  { token: "meta-externalagent", bot: "Meta AI crawler", kind: "training" },
  { token: "MistralAI-User", bot: "Mistral Le Chat", kind: "user" },
  { token: "DuckAssistBot", bot: "DuckDuckGo AI", kind: "user" },
  // Bing's index also feeds Copilot and much of ChatGPT search.
  { token: "bingbot", bot: "Bing", kind: "search" },
  { token: "Googlebot", bot: "Google", kind: "search" },
  { token: "Applebot", bot: "Apple (Siri, Spotlight)", kind: "search" },
  { token: "Amazonbot", bot: "Amazon", kind: "training" },
  { token: "CCBot", bot: "Common Crawl", kind: "training" },
  { token: "facebookexternalhit", bot: "Facebook or Messenger link preview", kind: "preview" },
  { token: "WhatsApp", bot: "WhatsApp link preview", kind: "preview" },
];

const LOWERED = RULES.map((r) => ({ ...r, token: r.token.toLowerCase() }));

export function identifyCrawler(userAgent: string | null | undefined): Crawler | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  const hit = LOWERED.find((r) => ua.includes(r.token));
  return hit ? { bot: hit.bot, kind: hit.kind } : null;
}

export const CRAWLER_KIND_LABELS: Record<CrawlerKind, { title: string; description: string }> = {
  referral: {
    title: "Visitors from AI answers",
    description: "A person clicked through to BiteSync from an AI assistant's answer.",
  },
  user: {
    title: "Read to answer someone",
    description: "A person asked an AI a question and it read this page to answer.",
  },
  search: {
    title: "Indexed for search",
    description: "Read so it can appear in search and AI answers later.",
  },
  training: {
    title: "Collected for AI training",
    description: "Gathered to train AI models.",
  },
  preview: {
    title: "Link shared",
    description: "Someone pasted a link into a post or chat, which fetched a preview.",
  },
};
