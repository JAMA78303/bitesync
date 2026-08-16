/**
 * BiteSync service worker — push notifications only.
 *
 * Deliberately has NO `fetch` handler: this worker never caches or serves app
 * responses, so it cannot pin users to a stale build. Its whole job is to show
 * pushed notifications and route clicks back into the app.
 */

self.addEventListener("install", () => {
  // Replace any previous worker immediately rather than waiting for all tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "BiteSync";
  const options = {
    body: payload.body || "",
    icon: "/favicon-192.png",
    badge: "/favicon-192.png",
    tag: payload.tag || "bitesync",
    // A new nudge replaces the previous one of the same kind instead of stacking.
    renotify: Boolean(payload.tag),
    data: { url: payload.url || "/planner" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/planner";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus an existing BiteSync tab and navigate it, rather than opening duplicates.
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
