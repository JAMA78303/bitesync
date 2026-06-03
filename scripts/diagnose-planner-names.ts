/**
 * STEP 1 diagnostic: print recipe names backing planner slots.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/diagnose-planner-names.ts
 *   ... --week=2026-06-02   (optional Monday ISO date)
 */
import { createServiceClient } from "@/lib/supabase/service";
import { getMonday, toLocalISO } from "@/lib/utils/dates";

function parseWeekArg(argv: string[]): string {
  const arg = argv.find((a) => a.startsWith("--week="));
  if (arg) return arg.split("=")[1]?.trim() ?? toLocalISO(getMonday(new Date()));
  return toLocalISO(getMonday(new Date()));
}

async function main() {
  const weekStart = parseWeekArg(process.argv.slice(2));
  const supabase = createServiceClient();

  const { data: plans, error: planErr } = await supabase
    .from("meal_plans")
    .select("id,user_id,week_start_date")
    .eq("week_start_date", weekStart);

  if (planErr) throw new Error(planErr.message);
  if (!plans?.length) {
    console.log(`No meal plans for week starting ${weekStart}`);
    return;
  }

  for (const plan of plans) {
    const { data: entries, error } = await supabase
      .from("meal_plan_entries")
      .select(
        `
        id, day_of_week, meal_type,
        recipe:recipes ( id, name )
      `,
      )
      .eq("meal_plan_id", plan.id)
      .order("day_of_week")
      .order("meal_type");

    if (error) throw new Error(error.message);

    console.log(`\nPlan ${plan.id} (user ${plan.user_id}) — week ${plan.week_start_date}`);
    console.log("day | meal      | stored recipe name (length)");
    console.log("----+-----------+------------------------------");

    for (const entry of entries ?? []) {
      const recipe = entry.recipe as { id?: string; name?: string } | null;
      const name = recipe?.name ?? "(no recipe)";
      const len = name.length;
      const flag = len <= 2 ? " ⚠️ TRUNCATED?" : "";
      const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][entry.day_of_week] ?? "?";
      console.log(
        `${day.padEnd(3)} | ${String(entry.meal_type).padEnd(9)} | "${name}" (${len})${flag}`,
      );
    }

    const suspicious = (entries ?? []).filter((e) => {
      const n = (e.recipe as { name?: string } | null)?.name ?? "";
      return n.length <= 2;
    });
    if (suspicious.length) {
      console.log(`\n⚠️  ${suspicious.length} slot(s) with names ≤2 chars — likely DATA bug (Step 2A).`);
    } else {
      console.log("\n✓ All stored names look like full strings — if UI shows one letter, it is a LAYOUT bug (Step 2B).");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
