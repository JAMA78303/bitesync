import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  detectSourceType,
  isSocialSourceType,
  type RecipeSourceType,
} from "@/lib/recipes/detectSourceType";
import { extractOpenGraphText, fetchSocialCaption } from "@/lib/recipes/extractCaptionText";
import {
  extractIngredientsFromCaption,
  extractStepsFromCaption,
} from "@/lib/recipes/extractCaptionRecipe";
import { extractRecipeFromHtml } from "@/lib/recipes/extractRecipeFromHtml";
import type { PublisherNutritionPerServing } from "@/lib/nutrition/publisherNutrition";
import type { ParsedIngredient } from "@/lib/recipes/parseIngredient";

export type ImportApiResponse = {
  name: string;
  ingredients: ParsedIngredient[];
  steps: string[];
  sourceUrl: string;
  sourceDomain: string;
  sourceType: RecipeSourceType;
  detectedServings: number;
  publisherNutritionPerServing?: PublisherNutritionPerServing;
  importNotice?: string;
};

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeSourceUrl(value: string): string {
  const u = new URL(value);
  u.hash = "";
  if (u.pathname !== "/") {
    u.pathname = u.pathname.replace(/\/+$/, "");
  }
  return u.toString();
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BiteSync/1.0; +https://bitesync.io)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 403 || res.status === 429) {
    throw new Error("blocked");
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.text();
}

function socialImportNotice(sourceType: RecipeSourceType): string {
  const label =
    sourceType === "tiktok"
      ? "TikTok"
      : sourceType === "instagram"
        ? "Instagram"
        : sourceType === "facebook"
          ? "Facebook"
          : "social post";
  return `We pulled this from the ${label} caption — please check the ingredients and amounts below.`;
}

function buildImportResponse(
  partial: Omit<ImportApiResponse, "sourceUrl" | "sourceDomain"> & { sourceUrl: string },
): ImportApiResponse {
  const sourceDomain = new URL(partial.sourceUrl).hostname.replace(/^www\./, "");
  return {
    ...partial,
    sourceDomain,
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawUrl = String(body?.url ?? "").trim();
  if (!rawUrl || !isValidUrl(rawUrl)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  const sourceUrl = normalizeSourceUrl(rawUrl);
  const sourceType = detectSourceType(sourceUrl);

  // Only block when an active (non-archived) recipe exists — archived/deleted-from-list recipes can be re-imported.
  const { data: existing } = await supabase
    .from("recipes")
    .select("id,name")
    .eq("user_id", user.id)
    .eq("source_url", sourceUrl)
    .is("archived_at", null)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `You've already imported this recipe: ${existing.name}` },
      { status: 409 },
    );
  }

  try {
    let html = "";
    try {
      html = await fetchPage(sourceUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (isSocialSourceType(sourceType)) {
        return NextResponse.json(
          buildImportResponse({
            name: "Imported recipe",
            ingredients: [],
            steps: [],
            sourceUrl,
            sourceType,
            detectedServings: 1,
            importNotice: socialImportNotice(sourceType),
          }),
        );
      }
      if (msg === "blocked") {
        return NextResponse.json(
          buildImportResponse({
            name: "Imported recipe",
            ingredients: [],
            steps: [],
            sourceUrl,
            sourceType: "unknown",
            detectedServings: 1,
            importNotice:
              "We couldn't read this page automatically. Add the recipe details below before saving.",
          }),
        );
      }
      throw err;
    }

    if (isSocialSourceType(sourceType)) {
      const socialType = sourceType;
      const caption = await fetchSocialCaption(socialType, sourceUrl, html);
      const captionText = caption.description || caption.title;
      const ingredients = extractIngredientsFromCaption(captionText);
      const steps = extractStepsFromCaption(captionText);

      return NextResponse.json(
        buildImportResponse({
          name: caption.title || "Imported recipe",
          ingredients,
          steps,
          sourceUrl,
          sourceType,
          detectedServings: 1,
          importNotice: socialImportNotice(sourceType),
        }),
      );
    }

    const extracted = extractRecipeFromHtml(html);
    if (extracted.ingredients.length > 0) {
      return NextResponse.json(
        buildImportResponse({
          name: extracted.name,
          ingredients: extracted.ingredients,
          steps: extracted.steps,
          sourceUrl,
          sourceType,
          detectedServings: extracted.detectedServings,
          publisherNutritionPerServing: extracted.publisherNutritionPerServing,
        }),
      );
    }

    const og = extractOpenGraphText(html);
    return NextResponse.json(
      buildImportResponse({
        name: extracted.name || og.title || "Imported recipe",
        ingredients: extractIngredientsFromCaption(og.description),
        steps: extractStepsFromCaption(og.description),
        sourceUrl,
        sourceType: extracted.name ? sourceType : "unknown",
        detectedServings: extracted.detectedServings,
        importNotice:
          "We found limited recipe data on this page. Review and fill in any missing details before saving.",
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("aborted")) {
      return NextResponse.json({ error: "That page took too long to load." }, { status: 408 });
    }
    return NextResponse.json(
      buildImportResponse({
        name: "Imported recipe",
        ingredients: [],
        steps: [],
        sourceUrl,
        sourceType: "unknown",
        detectedServings: 1,
        importNotice:
          "We couldn't extract much from this link. Add the recipe details below before saving.",
      }),
    );
  }
}
