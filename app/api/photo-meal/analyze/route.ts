import { NextResponse } from "next/server";
import { z } from "zod";
import { photoLoggingVisible, takePhotoLog } from "@/lib/photoMeal/access";
import { identifyMeal } from "@/lib/photoMeal/identify";
import { matchFood } from "@/lib/photoMeal/matchFood";
import type { PhotoMealAnalysis } from "@/lib/photoMeal/types";
import { createClient } from "@/lib/supabase/server";

// The browser shrinks photos to about 1,024 px before sending (~150–300 KB).
// 2.5 MB of base64 is a generous ceiling that still stays under Vercel's limit.
const MAX_BASE64_CHARS = 2_500_000;

const body = z.object({
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  image: z.string().min(100).max(MAX_BASE64_CHARS),
});

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/**
 * Snap a meal: photo in, editable foods out.
 *
 * The AI names the foods and guesses weight ranges; every number comes from
 * CoFID (matchFood). The photo is only held in memory for this request and is
 * never written anywhere.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "Please sign in again.");
  if (!(await photoLoggingVisible(user.id))) return fail(403, "Photo logging isn't available on your account.");

  let parsed: z.infer<typeof body>;
  try {
    const result = body.safeParse(await request.json());
    if (!result.success) return fail(400, "That photo couldn't be read. Try another one.");
    parsed = result.data;
  } catch {
    return fail(400, "That photo couldn't be read. Try another one.");
  }

  if (!(await takePhotoLog(user.id))) {
    return fail(429, "You've used today's photo estimates. You can still log meals by name.");
  }

  const identified = await identifyMeal({ mediaType: parsed.mediaType, base64: parsed.image });
  if (identified.kind === "not_food") {
    return fail(422, "We couldn't see any food in that photo. Try again with the whole plate in view.");
  }
  if (identified.kind === "failed") {
    console.warn("[photo-meal] identify failed:", identified.reason);
    return fail(502, "We couldn't read that photo just now. Try again in a moment.");
  }

  const [items, extras] = await Promise.all([
    Promise.all(
      identified.foods.map(async (f, i) => ({
        key: `f${i}`,
        name: f.food,
        cookingMethod: f.cookingMethod,
        gramsLow: f.gramsLow,
        gramsHigh: f.gramsHigh,
        confidence: f.confidence,
        match: await matchFood(f.food),
      })),
    ),
    Promise.all(
      identified.extras.map(async (e, i) => ({
        key: `x${i}`,
        name: e.food,
        grams: e.grams,
        match: await matchFood(e.food),
      })),
    ),
  ]);

  const analysis: PhotoMealAnalysis = { title: identified.title, items, extras };
  return NextResponse.json(analysis);
}
