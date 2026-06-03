import Link from "next/link";
import { logout } from "@/app/(app)/settings/actions";
import { SettingsThemeRow } from "@/components/settings/SettingsThemeRow";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { reconcileBillingSubscriptionFromStripe } from "@/lib/stripe/reconcile-billing-subscription";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { ds } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

const SETTINGS_GROUPS = [
  {
    title: "Account",
    items: [
      { icon: "💳", label: "Billing & subscription", href: "/billing" },
      { icon: "🔒", label: "Change password", href: "/reset" },
    ],
  },
  {
    title: "About",
    items: [
      { icon: "📋", label: "Privacy policy", href: "/privacy" },
      { icon: "📄", label: "Terms of service", href: "/terms" },
      { icon: "💬", label: "Give feedback", href: "mailto:hello@bitesync.io", external: true },
    ],
  },
] as const;

export default async function SettingsPage() {
  const supabase = await createClient();
  let [profile, auth] = await Promise.all([getProfile(), supabase.auth.getUser()]);
  const {
    data: { user },
  } = auth;

  if (user && profile && !isProSubscriptionStatus(profile.subscription_status)) {
    const reconciled = await reconcileBillingSubscriptionFromStripe({
      userId: user.id,
      subscriptionStatus: profile.subscription_status,
      stripeCustomerId: profile.stripe_customer_id ?? null,
      stripeSubscriptionId: profile.stripe_subscription_id ?? null,
    });
    if (reconciled.isPro) {
      profile = await getProfile();
    }
  }

  const isPro = isProSubscriptionStatus(profile?.subscription_status);
  const isAdmin =
    !!user &&
    (process.env.ADMIN_USER_ID ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .includes(user.id);

  const email = user?.email ?? "Account";
  const initial = email[0]?.toUpperCase() ?? "?";

  return (
    <div className="-mx-4 min-h-screen bg-gray-50 dark:bg-gray-950 md:mx-0">
      <div className="bg-gradient-to-b from-[#3a5a40] to-[#4a7a50] px-4 pt-14 pb-10">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="mt-0.5 text-sm text-white/60">{email}</p>
      </div>

      <div className="space-y-4 px-4 -mt-6 pb-28">
        <div className={`${ds.card} mb-4 flex items-center gap-4 ${ds.cardPadding}`}>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#3a5a40] text-xl font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{email}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                isPro ? "bg-[#3a5a40] text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800"
              }`}
            >
              {isPro ? "✦ Pro" : "Free plan"}
            </span>
          </div>
        </div>

        <div>
          <p className={`${ds.label} mb-2 px-1`}>App</p>
          <div className={`${ds.card} overflow-hidden`}>
            <SettingsThemeRow />
          </div>
        </div>

        <Link
          href="/goals"
          className={`${ds.card} flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800`}
        >
          <span className="w-7 text-center text-lg">🎯</span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nutrition &amp; goals</span>
            <span className="text-xs text-gray-500">Dietary preferences and calorie targets</span>
          </span>
          <Chevron />
        </Link>

        {SETTINGS_GROUPS.map((group) => (
          <div key={group.title}>
            <p className={`${ds.label} mb-2 px-1`}>{group.title}</p>
            <div className={`${ds.card} overflow-hidden`}>
              {group.items.map((item, i) => (
                <div key={item.label}>
                  {"external" in item && item.external ? (
                    <a
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span className="w-7 text-center text-lg">{item.icon}</span>
                      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                      <Chevron />
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span className="w-7 text-center text-lg">{item.icon}</span>
                      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                      <Chevron />
                    </Link>
                  )}
                  {i < group.items.length - 1 ? (
                    <div className="ml-14 h-px bg-gray-50 dark:bg-gray-800" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}

        {isAdmin ? (
          <div className="rounded-2xl bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Admin</p>
                <p className="mt-0.5 text-xs text-gray-400">Internal tools</p>
              </div>
              <Link href="/admin/prices" className="text-xs text-gray-300 hover:text-white">
                Price manager →
              </Link>
            </div>
          </div>
        ) : null}

        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-2xl border border-red-100 bg-red-50 py-3.5 text-sm font-semibold text-red-500 dark:border-red-900 dark:bg-red-950/20"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg className="h-4 w-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
