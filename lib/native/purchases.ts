import { Purchases, type PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { isNativeApp } from "@/lib/native/bridge";

/**
 * Buying Pro inside the iPhone app: an App Store subscription, sold through
 * RevenueCat. This side only shows Apple's prices and starts the purchase;
 * what an account has paid for is decided on the server
 * (lib/iap/revenuecat.ts), never from what the app says. Client-side only.
 *
 * The RevenueCat customer is the signed-in account's id, so a purchase follows
 * the account, not the phone.
 */

// RevenueCat's public app key (starts "appl_"): safe to ship in the page.
const API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY ?? "";

let customer: string | null = null;

async function ready(userId: string): Promise<void> {
  if (!isNativeApp() || !API_KEY) throw new Error("In-app purchases aren't available here.");
  if (customer === userId) return;
  const { isConfigured } = await Purchases.isConfigured();
  if (isConfigured) await Purchases.logIn({ appUserID: userId });
  else await Purchases.configure({ apiKey: API_KEY, appUserID: userId });
  customer = userId;
}

export type ProOffer = {
  period: "month" | "year";
  /** Apple's own price text for the buyer's App Store country, e.g. "£6.99". */
  price: string;
  /** The yearly price per month, where Apple supplies it. */
  perMonth: string | null;
  pkg: PurchasesPackage;
};

/** The monthly and yearly Pro subscriptions as the App Store offers them here. */
export async function loadProOffers(userId: string): Promise<ProOffer[]> {
  await ready(userId);
  const { current } = await Purchases.getOfferings();
  const offers: ProOffer[] = [];
  if (current?.annual) {
    const { product } = current.annual;
    offers.push({ period: "year", price: product.priceString, perMonth: product.pricePerMonthString, pkg: current.annual });
  }
  if (current?.monthly) {
    offers.push({ period: "month", price: current.monthly.product.priceString, perMonth: null, pkg: current.monthly });
  }
  return offers;
}

/** Opens Apple's purchase sheet. "cancelled" when the buyer closes it. */
export async function buyPro(userId: string, pkg: PurchasesPackage): Promise<"bought" | "cancelled"> {
  await ready(userId);
  try {
    await Purchases.purchasePackage({ aPackage: pkg });
    return "bought";
  } catch (err) {
    const e = err as { userCancelled?: boolean | null; code?: string | number };
    // "1" is RevenueCat's code for a purchase the buyer cancelled.
    if (e?.userCancelled === true || String(e?.code) === "1") return "cancelled";
    throw err;
  }
}

/** Re-attaches purchases made with this Apple Account (new phone, reinstall). */
export async function restorePro(userId: string): Promise<void> {
  await ready(userId);
  await Purchases.restorePurchases();
}

/** On sign-out: stop treating this phone's purchases as that account's. */
export async function signOutOfPurchases(): Promise<void> {
  if (!isNativeApp() || !API_KEY) return;
  customer = null;
  const { isConfigured } = await Purchases.isConfigured();
  if (isConfigured) await Purchases.logOut();
}
