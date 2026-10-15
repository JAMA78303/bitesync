/**
 * "Not now" on the weekly-habit card (reminders and add to home screen) hides
 * it on this device for three weeks. Long enough not to nag; short enough that
 * someone who has started planning every week gets asked again.
 */
export const HABIT_CARD_SNOOZE_KEY = "bitesync:habit-card-snoozed-at";
export const HABIT_CARD_SNOOZE_MS = 21 * 24 * 60 * 60 * 1000;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function isHabitCardSnoozed(storage: StorageLike, now = Date.now()): boolean {
  try {
    const at = Number(storage.getItem(HABIT_CARD_SNOOZE_KEY));
    return Number.isFinite(at) && at > 0 && now - at < HABIT_CARD_SNOOZE_MS;
  } catch {
    // Storage blocked (private mode): show the card, it's dismissible anyway.
    return false;
  }
}

export function snoozeHabitCard(storage: StorageLike, now = Date.now()): void {
  try {
    storage.setItem(HABIT_CARD_SNOOZE_KEY, String(now));
  } catch {
    // Nothing to do; the card just reappears next visit.
  }
}
