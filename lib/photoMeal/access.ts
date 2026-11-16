import { isNativeAppRequest } from "@/lib/native/server";
import { createSupabaseAuthAdmin } from "@/lib/supabase/admin";
import { getAccess } from "@/lib/subscription";

/** Photos one account may analyse per day (UTC), so one account can't run up the AI bill. */
export const PHOTO_LOGS_PER_DAY = 30;

const USAGE_KEY = "photo_logs";

function adminIds(): string[] {
  return (process.env.ADMIN_USER_ID ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Who sees "Snap a meal".
 *
 * - Off for everyone except admins until PHOTO_MEAL_LOGGING=on, which is set
 *   only once the photo eval (evals/photo-meals) meets its targets.
 * - Pro and trial only.
 * - Not in the iPhone app yet: build 1.0 has no camera permission text, and
 *   iOS closes an app that opens the camera without it. The 1.1 build adds it.
 */
export async function photoLoggingVisible(userId: string): Promise<boolean> {
  const released = process.env.PHOTO_MEAL_LOGGING === "on";
  if (!released && !adminIds().includes(userId)) return false;
  if (await isNativeAppRequest()) return false;
  const access = await getAccess();
  return access?.hasPro === true;
}

type Usage = { day: string; count: number };

function readUsage(meta: Record<string, unknown> | undefined, today: string): number {
  const u = meta?.[USAGE_KEY] as Usage | undefined;
  return u && u.day === today && typeof u.count === "number" ? u.count : 0;
}

/**
 * Uses one of today's photo analyses, just before calling the AI. Counted in
 * auth app_metadata, which only the service role can write, so the browser
 * can't reset it. False when the day's allowance is spent or the count can't
 * be recorded (don't spend uncounted AI). Two requests at the same instant
 * can both take the last one; the overshoot is a photo or two.
 */
export async function takePhotoLog(userId: string, now = new Date()): Promise<boolean> {
  const today = now.toISOString().slice(0, 10);
  const admin = createSupabaseAuthAdmin();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) return false;
  const meta = data.user.app_metadata ?? {};
  const used = readUsage(meta, today);
  if (used >= PHOTO_LOGS_PER_DAY) return false;
  const { error: writeError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...meta, [USAGE_KEY]: { day: today, count: used + 1 } satisfies Usage },
  });
  return !writeError;
}
