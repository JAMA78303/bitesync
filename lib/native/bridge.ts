import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Preferences } from "@capacitor/preferences";
import { Share } from "@capacitor/share";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * The iPhone app's native features, for client components. Each helper does
 * nothing (or reports false) in a browser, so callers don't branch twice.
 * The server can't see Capacitor; it reads the user agent (lib/native/server.ts).
 */

/** True inside the BiteSync iPhone app. Call from effects or handlers, not render. */
export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/**
 * The colour of the clock and battery icons. capacitor.config.ts starts with
 * light icons for the deep-green sign-in pages; the signed-in top bar is ivory
 * in light mode, where the icons have to be dark to show.
 */
export function setStatusBarIcons(icons: "light" | "dark"): void {
  if (!isNativeApp()) return;
  // Capacitor names styles after the background: Style.Dark gives light icons.
  StatusBar.setStyle({ style: icons === "light" ? Style.Dark : Style.Light }).catch(() => {
    // Cosmetic; leave the icons as they are.
  });
}

/** A light tap the user feels, e.g. ticking off a grocery item. */
export function tapFeedback(): void {
  if (!isNativeApp()) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
    // Haptics are a nicety; a phone without them just stays still.
  });
}

/**
 * The iPhone share sheet. Resolves false when the user closes it without
 * sharing; rejects only when the sheet couldn't open.
 */
export async function shareNative(title: string, text: string): Promise<boolean> {
  try {
    await Share.share({ title, text, dialogTitle: title });
    return true;
  } catch (err) {
    if (err instanceof Error && /cancel/i.test(err.message)) return false;
    throw err;
  }
}

/**
 * The grocery list shown by native/www/offline.html when the site can't load,
 * so it still works in a shop with no signal. Keep the key in step with that page.
 */
export const OFFLINE_GROCERY_KEY = "offline-grocery-list";

export type OfflineGroceryList = {
  /** Plain text from groceryShareText, or null when everything is ticked off. */
  text: string | null;
  /** The list's week (Monday, YYYY-MM-DD). */
  weekStart: string;
  savedAt: string;
};

export async function saveOfflineGroceryList(text: string | null, weekStart: string): Promise<void> {
  if (!isNativeApp()) return;
  const value: OfflineGroceryList = { text, weekStart, savedAt: new Date().toISOString() };
  await Preferences.set({ key: OFFLINE_GROCERY_KEY, value: JSON.stringify(value) });
}

/** After a list is deleted: forget it, if it's the one kept for offline. */
export async function clearOfflineGroceryList(weekStart: string): Promise<void> {
  if (!isNativeApp()) return;
  const { value } = await Preferences.get({ key: OFFLINE_GROCERY_KEY });
  try {
    if (value && (JSON.parse(value) as Partial<OfflineGroceryList>).weekStart !== weekStart) return;
  } catch {
    // Unreadable: remove it.
  }
  await Preferences.remove({ key: OFFLINE_GROCERY_KEY });
}
