import { NextResponse } from "next/server";
import { setCofidLookupSupabase } from "@/lib/nutrition/cofidLookup";
import {
  formatMacroRecomputeBatchReport,
  type PlannerChangeSnapshot,
  runMacroRecomputeMigration,
} from "@/lib/recipes/macroRecompute";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function getAdminIds(): string[] {
  return (process.env.ADMIN_USER_ID ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !getAdminIds().includes(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      dryRun?: boolean;
      offset?: number;
      plannerSnapshots?: PlannerChangeSnapshot[];
    };

    const admin = createSupabaseAdmin();
    setCofidLookupSupabase(admin);

    const batch = await runMacroRecomputeMigration({
      supabase: admin,
      dryRun: body.dryRun !== false,
      aiEnabled: false,
      offset: body.offset ?? 0,
      plannerSnapshots: body.plannerSnapshots,
    });

    const significantSnapshots: PlannerChangeSnapshot[] = batch.significantChanges.map((r) => ({
      recipeId: r.recipeId,
      recipeName: r.recipeName,
      userId: r.userId,
      oldCalories: r.oldCalories,
      newCalories: r.newCalories,
    }));

    return NextResponse.json({
      summary: formatMacroRecomputeBatchReport(batch),
      hasMore: batch.hasMore,
      nextOffset: batch.nextOffset,
      significantSnapshots,
      errorCount: batch.errors.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[macro-recompute]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
