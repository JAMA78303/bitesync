import assert from "node:assert/strict";
import { identifyCrawler } from "./aiCrawlers";

const cases: Array<[string, string | null, string | null]> = [
  // [user agent, expected bot, expected kind] — strings as each company publishes them.
  ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot", "ChatGPT", "user"],
  ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot", "ChatGPT search", "search"],
  ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)", "OpenAI training", "training"],
  ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)", "Perplexity", "user"],
  ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)", "Perplexity search", "search"],
  ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)", "Anthropic training", "training"],
  ["meta-externalfetcher/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)", "Meta AI", "user"],
  ["meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)", "Meta AI crawler", "training"],
  ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36", "Bing", "search"],
  ["Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "Google", "search"],
  ["facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)", "Facebook or Messenger link preview", "preview"],
  ["WhatsApp/2.24.20.80 A", "WhatsApp link preview", "preview"],
  // People are not bots — including someone tapping a link inside the Facebook app.
  ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0;FBBV/1;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/18.5]", null, null],
  ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", null, null],
  ["", null, null],
];

for (const [ua, bot, kind] of cases) {
  const hit = identifyCrawler(ua);
  assert.equal(hit?.bot ?? null, bot, `bot for: ${ua.slice(0, 60)}`);
  assert.equal(hit?.kind ?? null, kind, `kind for: ${ua.slice(0, 60)}`);
}
assert.equal(identifyCrawler(null), null);

console.log("aiCrawlers tests passed");
