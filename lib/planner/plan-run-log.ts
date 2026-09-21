import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanRunOutcome = "running" | "claude" | "heuristic" | "heuristic_fallback" | "error";

/** Filled in as a run proceeds. */
export type PlanRunTrace = {
  requested: "ai" | "heuristic";
  mealPlanId: string;
  startedAt: number;
  /** Row id once the start row is written; absent if the table is missing. */
  runId?: string;
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

function rowFor(trace: PlanRunTrace) {
  return {
    meal_plan_id: trace.mealPlanId,
    requested: trace.requested,
    outcome: trace.outcome ?? "running",
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
    updated_at: new Date().toISOString(),
  };
}

/**
 * Write the row at the start of a run, as 'running'. A run that stalls or is
 * killed then leaves a row with the phase it stopped in — the end-only insert
 * left nothing, which is indistinguishable from no run at all. Never throws.
 */
export async function startPlanRun(supabase: SupabaseClient, userId: string, trace: PlanRunTrace): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("plan_runs")
      .insert({ user_id: userId, ...rowFor(trace), outcome: "running", phase: "start" })
      .select("id")
      .single();
    if (error) console.warn("[plan_runs] start not recorded:", error.message);
    else trace.runId = data.id as string;
  } catch (err) {
    console.warn("[plan_runs] start not recorded:", describeError(err));
  }
}

/** Stamp the phase a run has reached. Cheap; fire-and-forget safe. */
export async function markPlanRunPhase(supabase: SupabaseClient, trace: PlanRunTrace, phase: string): Promise<void> {
  if (!trace.runId) return;
  try {
    await supabase
      .from("plan_runs")
      .update({ phase, total_ms: Date.now() - trace.startedAt, updated_at: new Date().toISOString() })
      .eq("id", trace.runId);
  } catch (err) {
    console.warn("[plan_runs] phase not recorded:", describeError(err));
  }
}

/** Final write. Updates the start row when there is one, inserts otherwise. */
export async function recordPlanRun(supabase: SupabaseClient, userId: string, trace: PlanRunTrace): Promise<void> {
  try {
    const row = { ...rowFor(trace), outcome: trace.outcome ?? "error", phase: "done" };
    const { error } = trace.runId
      ? await supabase.from("plan_runs").update(row).eq("id", trace.runId)
      : await supabase.from("plan_runs").insert({ user_id: userId, ...row });
    if (error) console.warn("[plan_runs] not recorded:", error.message);
  } catch (err) {
    console.warn("[plan_runs] not recorded:", describeError(err));
  }
}
