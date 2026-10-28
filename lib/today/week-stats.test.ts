import type { DayMacros } from "@/lib/planner/weekly-macros";
import { summariseWeek, weekStatsSentence } from "@/lib/today/week-stats";

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function week(kcal: number[], protein: number[]): DayMacros[] {
  return kcal.map((k, i) => ({
    dayOfWeek: i,
    dateISO: `2026-10-${String(19 + i).padStart(2, "0")}`,
    short: SHORT[i],
    num: "",
    kcal: k,
    protein: protein[i] ?? 0,
    carbs: 0,
    fat: 0,
  }));
}

const targets = { kcal: 2000, protein: 150 };

// A full week: 2000 and 1900 are on target, 1500 is under, 2400 is well over.
const full = summariseWeek(
  week([2000, 1900, 2000, 1500, 2000, 2400, 2000], [150, 140, 150, 120, 150, 160, 150]),
  targets,
);
assertEqual(full.plannedDays, 7, "full week planned days");
assertEqual(full.onTargetDays, 5, "full week on-target days");
assertEqual(full.proteinPct, 97, "full week protein (1020 / 7 = 145.7g of 150g)");
assertEqual(
  full.days.map((d) => d.status),
  ["on-track", "on-track", "on-track", "under", "on-track", "over-high", "on-track"],
  "full week statuses",
);
assertEqual(full.days.map((d) => d.letter).join(""), "MTWTFSS", "day letters");
assertEqual(weekStatsSentence(full), "On target 5 of 7 days · protein 97% of goal", "full week sentence");

// Unplanned days don't count against the week or drag the protein average down.
const partial = summariseWeek(week([2000, 0, 0, 1900, 0, 0, 0], [150, 0, 0, 120, 0, 0, 0]), targets);
assertEqual(partial.plannedDays, 2, "partial week planned days");
assertEqual(partial.onTargetDays, 2, "partial week on-target days");
assertEqual(partial.proteinPct, 90, "partial week protein averages planned days only");
assertEqual(partial.days[1], { dateISO: "2026-10-20", letter: "T", ratio: 0, status: null }, "unplanned day");
assertEqual(weekStatsSentence(partial), "On target 2 of 2 planned days · protein 90% of goal", "partial sentence");

const one = summariseWeek(week([1500, 0, 0, 0, 0, 0, 0], [100]), targets);
assertEqual(weekStatsSentence(one), "On target 0 of 1 planned day · protein 67% of goal", "one day sentence");

// Nothing planned: no protein figure to show.
const empty = summariseWeek(week([0, 0, 0, 0, 0, 0, 0], []), targets);
assertEqual(empty.plannedDays, 0, "empty week planned days");
assertEqual(empty.proteinPct, null, "empty week protein");

console.log("week-stats tests passed");
