import type { Crawler } from "@/lib/analytics/aiCrawlers";
import { hostOf, matchesHost } from "@/lib/analytics/aiReferrals";

/**
 * Recognises a person opening a BiteSync link that was shared on Facebook,
 * Instagram, Messenger or Threads. The "preview" rows (aiCrawlers.ts) show a
 * link was posted or sent; these show someone actually opened it.
 *
 * Two signals, either is enough:
 *  - the Referer is one of Meta's sites (m.facebook.com, l.instagram.com, …);
 *  - the link carries fbclid, which Meta adds to links people tap in its apps,
 *    even when the in-app browser sends no Referer. Only its presence is
 *    used: the value is never read or stored.
 */

const APPS: { name: string; hosts: string[] }[] = [
  { name: "Instagram", hosts: ["instagram.com"] },
  { name: "Messenger", hosts: ["messenger.com"] },
  { name: "Threads", hosts: ["threads.net", "threads.com"] },
  { name: "Facebook", hosts: ["facebook.com", "fb.com", "fb.me"] },
];

/** fbclid with no Referer: Meta doesn't say which of its apps the tap came from. */
export const ANY_META_APP = "Facebook, Instagram or Messenger";

export function identifySocialReferral(referer: string | null | undefined, hasFbclid: boolean): Crawler | null {
  const host = referer ? hostOf(referer) : null;
  if (host) {
    for (const app of APPS) {
      if (app.hosts.some((h) => matchesHost(host, h))) return { bot: app.name, kind: "social" };
    }
  }
  return hasFbclid ? { bot: ANY_META_APP, kind: "social" } : null;
}
