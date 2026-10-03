/**
 * Where people get help. hello@bitesync.io forwards to the founder's inbox via
 * Cloudflare Email Routing (set up 2026-10-03). Before then the domain had no
 * mail records at all, so the address in the privacy policy and terms bounced.
 */
export const SUPPORT_EMAIL = "hello@bitesync.io";

export function supportMailto(subject = "BiteSync support"): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
