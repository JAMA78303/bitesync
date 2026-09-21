import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanRunOutcome = "claude" | "heuristic" | "heuristic_fallback" | "error";

/** Filled in as a run proceeds; written once at the end. */
export type PlanRunTrace = {
  requested: "ai" | "heuristic";
  mealPlanId: string;
  startedAt: number;
  outcome?: PlanRunOutcome;
  claudeMs?: number;
  applyMs?: number;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  stopReason?: string | null;
  recipePool?: number;
  fallbackNotice?: string;
  error?: string;
};

export function describeError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`.slice(0, 500);
  return String(err).slice(0, 500);
}

/**
 * Record a week-plan run. Never throws and never blocks the plan: a failure
 * to log is a console warning, not a failed week. Tolerates the table not
 * existing yet (sql/2026-09-21_plan_runs.sql).
 */
export async function recordPlanRun(
  supabase: SupabaseClient,
  userId: string,
  trace: PlanRunTrace,
): Promise<void> {
  try {
    const { error } = await supabase.from("plan_runs").insert({
      user_id: userId,
      meal_plan_id: trace.mealPlanId,
      requested: trace.requested,
      outcome: trace.outcome ?? "error",
      total_ms: Date.now() - trace.startedAt,
      claude_ms: trace.claudeMs ?? null,
      apply_ms: trace.applyMs ?? null,
      model: trace.model ?? null,
      input_tokens: trace.inputTokens ?? null,
      output_tokens: trace.outputTokens ?? null,
      cache_read_tokens: trace.cacheReadTokens ?? null,
      stop_reason: trace.stopReason ?? null,
      recipe_pool: trace.recipePool ?? null,
      fallback_notice: trace.fallbackNotice ?? null,
      error: trace.error ?? null,
    });
    if (error) console.warn("[plan_runs] not recorded:", error.message);
  } catch (err) {
    console.warn("[plan_runs] not recorded:", describeError(err));
  }
}
