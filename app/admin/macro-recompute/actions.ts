"use server";

import { setCofidLookupSupabase } from "@/lib/nutrition/cofidLookup";
import {
  formatMacroRecomputeReport,
  runMacroRecomputeMigration,
  type MacroRecomputeReport,
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
  | { report: MacroRecomputeReport; summary: string };

export async function runMacroRecomputeAdmin(
  dryRun: boolean,
): Promise<MacroRecomputeActionResult> {
  const auth = await assertAdmin();
  if (auth.error) return { error: auth.error };

  const admin = createSupabaseAdmin();
  setCofidLookupSupabase(admin);

  const report = await runMacroRecomputeMigration({
    supabase: admin,
    dryRun,
    aiEnabled: false,
  });

  return {
    report,
    summary: formatMacroRecomputeReport(report),
  };
}
