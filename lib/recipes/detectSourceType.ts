export type RecipeSourceType = "recipe_blog" | "tiktok" | "instagram" | "facebook" | "unknown";

export function detectSourceType(url: string): RecipeSourceType {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("facebook.com") || host === "fb.com" || host.endsWith(".fb.com")) return "facebook";
    return "recipe_blog";
  } catch {
    return "unknown";
  }
}

export function isSocialSourceType(
  type: RecipeSourceType,
): type is "tiktok" | "instagram" | "facebook" {
  return type === "tiktok" || type === "instagram" || type === "facebook";
}
