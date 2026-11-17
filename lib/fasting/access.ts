/**
 * Who sees Ramadan mode and fasting days.
 *
 * Off for everyone except admins until FASTING_MODE=on is set in Vercel
 * (James, 17 Nov 2026: not on the web app yet). While it's off, nobody's
 * fasting settings are read either (getFastingSettings returns null), so
 * Today, the planner, plan generation and the iPhone reminders all behave as
 * if fasting was never set up, and the Ramadan offer card doesn't show.
 */
export function fastingModeReleased(): boolean {
  return process.env.FASTING_MODE === "on";
}

export function fastingModeVisible(userId: string | null | undefined): boolean {
  if (fastingModeReleased()) return true;
  if (!userId) return false;
  return (process.env.ADMIN_USER_ID ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .includes(userId);
}
