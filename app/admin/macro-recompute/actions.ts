"use server";

import { setCofidLookupSupabase } from "@/lib/nutrition/cofidLookup";
import {
  formatMacroRecomputeBatchReport,
  type PlannerChangeSnapshot,
  runMacroRecomputeMigration,
} from "@/lib/recipes/macroRecompute";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getAdminIds(): string[] {
  return (process.env.ADMIN_USER_ID ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

async function assertAdmin(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !getAdminIds().includes(user.id)) {
    return { error: "Unauthorized" };
  }
  return {};
}

export type MacroRecomputeActionResult =
  | { error: string }
  | {
      summary: string;
      hasMore: boolean;
      nextOffset: number;
      significantSnapshots: PlannerChangeSnapshot[];
    };

/** Single batch — prefer API route from UI for long runs. */
export async function runMacroRecomputeAdmin(
  dryRun: boolean,
  offset = 0,
  plannerSnapshots: PlannerChangeSnapshot[] = [],
): Promise<MacroRecomputeActionResult> {
  try {
    const auth = await assertAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createSupabaseAdmin();
    setCofidLookupSupabase(admin);

    const batch = await runMacroRecomputeMigration({
      supabase: admin,
      dryRun,
      aiEnabled: false,
      offset,
      plannerSnapshots,
    });

    return {
      summary: formatMacroRecomputeBatchReport(batch),
      hasMore: batch.hasMore,
      nextOffset: batch.nextOffset,
      significantSnapshots: batch.significantChanges.map((r) => ({
        recipeId: r.recipeId,
        recipeName: r.recipeName,
        userId: r.userId,
        oldCalories: r.oldCalories,
        newCalories: r.newCalories,
      })),
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
