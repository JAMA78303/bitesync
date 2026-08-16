/** Browser helpers for the push subscription lifecycle. Client-side only. */

export type PushSupport =
  | { supported: true }
  | { supported: false; reason: "unsupported" | "needs-install" };

/** iOS only exposes the Push API to PWAs added to the home screen. */
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIosDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as Mac; touch points disambiguate.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isIosDevice;
}

function isStandalonePwa(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function getPushSupport(): PushSupport {
  if (typeof window === "undefined") return { supported: false, reason: "unsupported" };
  const hasApis = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (hasApis) return { supported: true };
  if (isIosSafari() && !isStandalonePwa()) return { supported: false, reason: "needs-install" };
  return { supported: false, reason: "unsupported" };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i]!);
  return window.btoa(binary);
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export type SerializedSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string;
};

export function serializeSubscription(sub: PushSubscription): SerializedSubscription {
  return {
    endpoint: sub.endpoint,
    p256dh: arrayBufferToBase64(sub.getKey("p256dh")),
    auth: arrayBufferToBase64(sub.getKey("auth")),
    userAgent: navigator.userAgent.slice(0, 300),
  };
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/** Requests permission if needed, then returns a live push subscription. */
export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked for this site — allow them in your browser settings."
        : "Notification permission was dismissed.",
    );
  }

  const registration = await registerPushServiceWorker();
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const key = urlBase64ToUint8Array(vapidPublicKey);
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key as BufferSource,
  });
}

export async function unsubscribeFromPush(): Promise<string | null> {
  const sub = await getExistingSubscription();
  if (!sub) return null;
  const { endpoint } = sub;
  await sub.unsubscribe();
  return endpoint;
}
