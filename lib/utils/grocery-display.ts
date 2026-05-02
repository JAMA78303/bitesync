import { DAY_LABELS, DAY_NAMES } from "@/types";
import { formatWeekLabel } from "@/lib/utils/dates";

/** Subtitle under “Grocery List”: week range, or selected days + range when partially generated. */
export function formatGrocerySubtitle(monday: Date, scopeDays: number[] | null | undefined): string {
  const weekRange = formatWeekLabel(monday);
  if (scopeDays == null || scopeDays.length === 0) return weekRange;

  const sorted = [...new Set(scopeDays)].sort((a, b) => a - b);
  if (sorted.length >= 7) return weekRange;

  if (sorted.length === 1) {
    const name = DAY_NAMES[sorted[0]] ?? DAY_LABELS[sorted[0]] ?? `Day ${sorted[0]}`;
    return `${name} only · ${weekRange}`;
  }

  const labels = sorted.map((d) => DAY_LABELS[d] ?? `Day ${d}`).join(", ");
  return `${labels} · ${weekRange}`;
}
