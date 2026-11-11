/**
 * The iPhone app (ios/, capacitor.config.ts) loads the live site in a native
 * shell and adds this marker to the browser's user agent, so pages can tell an
 * in-app visit from Safari. Apple doesn't allow web checkout inside an iOS app,
 * so in the app Pro is sold through Apple instead of Stripe.
 */
export const NATIVE_APP_UA_MARKER = "BiteSyncApp";

export function isNativeAppUserAgent(userAgent: string | null | undefined): boolean {
  return typeof userAgent === "string" && userAgent.includes(NATIVE_APP_UA_MARKER);
}

/**
 * Whether Pro can be bought inside the iPhone app (an App Store subscription
 * through RevenueCat; lib/native/purchases.ts). It needs RevenueCat's public
 * app key. Until that is set, the app shows no prices or upgrade links at all.
 */
export function nativePurchasesEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY);
}
