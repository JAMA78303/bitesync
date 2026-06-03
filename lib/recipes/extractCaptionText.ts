import * as cheerio from "cheerio";

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
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
