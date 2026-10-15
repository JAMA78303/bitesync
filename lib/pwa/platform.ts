/**
 * How to get BiteSync onto this device's home screen, if it isn't already.
 * Pure, so it can be tested without a browser.
 *
 * - "installed": opened from the home screen already.
 * - "prompt": the browser offered its own install dialog (Chrome, Edge, Android).
 * - "ios-steps": iPhone or iPad. Nothing can open the dialog for them, so we
 *   show the Share → Add to Home Screen steps. On iOS this is also what makes
 *   reminders possible: Safari only allows notifications from home-screen apps.
 * - "android-steps": Android without the browser's dialog; the menu still has it.
 * - "none": desktop without a dialog; not worth asking.
 */
export type InstallHelp = "installed" | "prompt" | "ios-steps" | "android-steps" | "none";

export type DeviceInfo = {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  standalone: boolean;
  hasPrompt: boolean;
};

export function isIosDevice(d: Pick<DeviceInfo, "userAgent" | "platform" | "maxTouchPoints">): boolean {
  return (
    /iPad|iPhone|iPod/.test(d.userAgent) ||
    // iPadOS 13+ reports itself as a Mac; touch points give it away.
    (d.platform === "MacIntel" && (d.maxTouchPoints ?? 0) > 1)
  );
}

export function installHelpFor(d: DeviceInfo): InstallHelp {
  if (d.standalone) return "installed";
  if (d.hasPrompt) return "prompt";
  if (isIosDevice(d)) return "ios-steps";
  if (/Android/i.test(d.userAgent)) return "android-steps";
  return "none";
}
