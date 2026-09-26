/**
 * Tell Bing (and every IndexNow engine: Yandex, Seznam, Naver) that the
 * site's pages changed, so they re-crawl now instead of in days.
 *
 * Why Bing matters here: ChatGPT's web search answers from Bing's index, so
 * a page Bing hasn't seen is a page ChatGPT can't cite. Google does not use
 * IndexNow; it reads the sitemap.
 *
 * The key is public by design — the protocol verifies ownership by fetching
 * https://bitesync.io/<key>.txt, which lives in public/.
 *
 *   npx tsx scripts/indexnow.ts            # every URL in the live sitemap
 *   npx tsx scripts/indexnow.ts <url> ...  # just these
 */
const HOST = "bitesync.io";
const KEY = "068b2d74752d182f3ddb09edd5a10fa5";

async function sitemapUrls(): Promise<string[]> {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1]!.trim())
    // Login and signup forms are not content; don't spend crawl on them.
    .filter((u) => !/\/(login|signup)$/.test(u));
}

async function main() {
  const urlList = process.argv.slice(2).length ? process.argv.slice(2) : await sitemapUrls();
  if (!urlList.length) throw new Error("No URLs to submit");

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
  });
  // 200 = accepted, 202 = accepted and key validation pending. Anything else is a real failure.
  console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URLs`);
  for (const u of urlList) console.log("  ", u);
  if (res.status !== 200 && res.status !== 202) {
    console.error(await res.text());
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
