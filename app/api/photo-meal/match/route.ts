import { NextResponse } from "next/server";
import { z } from "zod";
import { photoLoggingVisible } from "@/lib/photoMeal/access";
import { matchFood } from "@/lib/photoMeal/matchFood";
import { createClient } from "@/lib/supabase/server";

const body = z.object({ name: z.string().trim().min(2).max(80) });

/**
 * "Swap the match": look up a food the user renamed on the review screen.
 * Answers { match } with per-100 g nutrition, or { match: null } when nothing
 * matched. No AI involved.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!(await photoLoggingVisible(user.id))) {
    return NextResponse.json({ error: "Photo logging isn't available on your account." }, { status: 403 });
  }

  let name: string;
  try {
    const parsed = body.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a food name." }, { status: 400 });
    name = parsed.data.name;
  } catch {
    return NextResponse.json({ error: "Enter a food name." }, { status: 400 });
  }

  return NextResponse.json({ match: await matchFood(name) });
}
