/**
 * Keeping a long client-side loop alive on a phone.
 *
 * Library generation runs slot-by-slot in the browser, so locking the phone or
 * switching apps suspends the loop mid-batch and nothing resumes it — the user
 * comes back to a half-filled library with no error. These two helpers make that
 * far less likely without moving generation server-side.
 */

type WakeLockLike = { release: () => Promise<void>; released: boolean } | null;

/**
 * Ask the browser to keep the screen on. Supported in Chrome/Edge/Android and
 * iOS 16.4+; a no-op elsewhere, and it can be refused (low battery), so callers
 * must still tolerate suspension.
 */
export async function requestScreenWakeLock(): Promise<WakeLockLike> {
  if (typeof navigator === "undefined") return null;
  const wakeLock = (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockLike> } })
    .wakeLock;
  if (!wakeLock?.request) return null;
  try {
    return await wakeLock.request("screen");
  } catch {
    // Refused (battery saver, permissions, not user-activated) — not fatal.
    return null;
  }
}

export async function releaseScreenWakeLock(lock: WakeLockLike): Promise<void> {
  if (!lock || lock.released) return;
  try {
    await lock.release();
  } catch {
    // Already gone; nothing to do.
  }
}

/**
 * Resolve once the tab is visible. A backgrounded tab has its timers throttled
 * and its fetches stalled, so awaiting this between units of work resumes the
 * batch when the user returns instead of failing everything left in it.
 */
export function waitUntilVisible(): Promise<void> {
  if (typeof document === "undefined" || document.visibilityState === "visible") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        document.removeEventListener("visibilitychange", onVisible);
        resolve();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
  });
}
