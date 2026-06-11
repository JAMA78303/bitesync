/** Parse common UK recipe duration phrases into minutes for step timers. */
export function parseStepDurationMinutes(step: string): number | null {
  const text = step.toLowerCase();
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/);
  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?)\b/);
  let total = 0;
  if (hourMatch?.[1]) total += Math.round(parseFloat(hourMatch[1]) * 60);
  if (minMatch?.[1]) total += Math.round(parseFloat(minMatch[1]));
  if (total > 0) return Math.min(total, 180);
  return null;
}

export function formatTimerDisplay(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
