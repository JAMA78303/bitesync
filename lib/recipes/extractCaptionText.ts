import * as cheerio from "cheerio";

/**
 * Recipe sites often put HTML-escaped text in their JSON-LD ("Corn &amp; Feta
 * Salad"), which then showed up literally in imported names.
 */
export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Last, so "&amp;lt;" becomes "&lt;" rather than "<".
    .replace(/&amp;/g, "&");
}

export function extractOpenGraphText(html: string): { title: string; description: string } {
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $('meta[name="twitter:title"]').attr("content")?.trim() ||
    $("title").first().text().trim() ||
    "";
  const description =
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[name="twitter:description"]').attr("content")?.trim() ||
    "";
  return { title: decodeHtmlEntities(title), description: decodeHtmlEntities(description) };
}

export async function fetchTikTokCaption(url: string): Promise<{ title: string; description: string }> {
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("tiktok_oembed_failed");
  const data = (await res.json()) as { title?: string; author_name?: string };
  return {
    title: data.title?.trim() || "Imported from TikTok",
    description: data.title?.trim() || "",
  };
}

export async function fetchSocialCaption(
  sourceType: "tiktok" | "instagram" | "facebook",
  url: string,
  html: string,
): Promise<{ title: string; description: string }> {
  if (sourceType === "tiktok") {
    try {
      return await fetchTikTokCaption(url);
    } catch {
      return extractOpenGraphText(html);
    }
  }
  return extractOpenGraphText(html);
}
