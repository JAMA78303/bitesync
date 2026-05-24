import { NextRequest, NextResponse } from "next/server";
import { lookupNutritionAsync } from "@/lib/nutrition/lookupAsync";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { name?: unknown; quantity?: unknown; unit?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (name.length < 2) {
    return NextResponse.json({ nutrition: null, found: false });
  }

  const quantity = Number(body.quantity);
  const unit = typeof body.unit === "string" ? body.unit.trim() || "g" : "g";

  try {
    const nutrition = await lookupNutritionAsync(name, Number.isFinite(quantity) ? quantity : 100, unit, {
      skipAI: true,
    });

    return NextResponse.json({
      nutrition,
      found: !!nutrition,
    });
  } catch (err) {
    console.error("Nutrition lookup error:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
