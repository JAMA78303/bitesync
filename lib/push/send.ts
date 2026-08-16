import webpush from "web-push";

export type PushPayload = {
  title: string;
  body: string;
  /** Path opened when the notification is clicked. */
  url?: string;
  /** Notifications sharing a tag replace each other instead of stacking. */
  tag?: string;
};

export type PushTarget = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/** Result of one send: `gone` means the subscription is dead and should be deleted. */
export type PushSendResult = { ok: true } | { ok: false; gone: boolean; error: string };

let configured = false;

export function pushEnvReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

function configureWebPush(): boolean {
  if (configured) return true;
  if (!pushEnvReady()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
  return true;
}

export async function sendPushNotification(
  target: PushTarget,
  payload: PushPayload,
): Promise<PushSendResult> {
  if (!configureWebPush()) {
    return { ok: false, gone: false, error: "Push is not configured (missing VAPID env vars)." };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 12 },
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    // 404/410 mean the browser dropped the subscription — the row is dead weight.
    const gone = statusCode === 404 || statusCode === 410;
    const error = err instanceof Error ? err.message : String(err);
    return { ok: false, gone, error };
  }
}
