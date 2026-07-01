import Link from "next/link";
import { logout } from "@/app/(app)/settings/actions";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { SettingsThemeRow } from "@/components/settings/SettingsThemeRow";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { reconcileBillingSubscriptionFromStripe } from "@/lib/stripe/reconcile-billing-subscription";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { ds } from "@/lib/ui/classes";

export const dynamic ="force-dynamic";

const SETTINGS_GROUPS = [
 {
 title:"Account",
 items: [
 { icon:"💳", label:"Billing & subscription", href:"/billing" },
 { icon:"🔒", label:"Change password", href:"/reset" },
 ],
 },
 {
 title:"About",
 items: [
 { icon:"📋", label:"Privacy policy", href:"/privacy" },
 { icon:"📄", label:"Terms of service", href:"/terms" },
 ],
 },
] as const;

export default async function SettingsPage() {
 const supabase = await createClient();
 const [initialProfile, auth] = await Promise.all([getProfile(), supabase.auth.getUser()]);
 let profile = initialProfile;
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
 (process.env.ADMIN_USER_ID ??"")
 .split(",")
 .map((v) => v.trim())
 .filter(Boolean)
 .includes(user.id);

 const email = user?.email ??"Account";
 const initial = email[0]?.toUpperCase() ??"?";

 return (
 <div className={ds.mobilePage}>
 <div className={`${ds.gradientHeader} pb-10`}>
 <h1 className={ds.pageTitle}>Settings</h1>
 <p className={`mt-0.5 ${ds.pageSubtitle}`}>{email}</p>
 </div>

 <div className={`${ds.mobileGutter} -mt-6 space-y-4 ${ds.pageContent}`}>
 <div className={`${ds.card} mb-4 flex items-center gap-4 ${ds.cardPadding}`}>
 <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-xl font-bold text-[var(--text-on-brand)]">
 {initial}
 </div>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-bold text-[var(--text-primary)]">{email}</p>
 <span
 className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
 isPro ?"bg-[var(--brand-primary)] text-[var(--text-on-brand)]" :"bg-[var(--surface-muted)] text-[var(--text-muted)]"
 }`}
 >
 {isPro ?"✦ Pro" :"Free plan"}
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
 className={`${ds.card} flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-muted)] `}
 >
 <span className="w-7 text-center text-lg">🎯</span>
 <span className="flex-1">
 <span className="block text-sm font-medium text-[var(--text-secondary)]">Nutrition &amp; goals</span>
 <span className="text-xs text-[var(--text-muted)]">Dietary preferences and calorie targets</span>
 </span>
 <Chevron />
 </Link>

 <div>
 <p className={`${ds.label} mb-2 px-1`}>Feedback</p>
 <div className={`${ds.card} overflow-hidden`}>
 <FeedbackForm />
 </div>
 </div>

 {SETTINGS_GROUPS.map((group) => (
 <div key={group.title}>
 <p className={`${ds.label} mb-2 px-1`}>{group.title}</p>
 <div className={`${ds.card} overflow-hidden`}>
 {group.items.map((item, i) => (
 <div key={item.label}>
 {"external" in item && item.external ? (
 <a
 href={item.href}
 className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-muted)]"
 >
 <span className="w-7 text-center text-lg">{item.icon}</span>
 <span className="flex-1 text-sm font-medium text-[var(--text-secondary)]">
 {item.label}
 </span>
 <Chevron />
 </a>
 ) : (
 <Link
 href={item.href}
 className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-muted)]"
 >
 <span className="w-7 text-center text-lg">{item.icon}</span>
 <span className="flex-1 text-sm font-medium text-[var(--text-secondary)]">
 {item.label}
 </span>
 <Chevron />
 </Link>
 )}
 {i < group.items.length - 1 ? (
 <div className="ml-14 h-px bg-[var(--surface-muted)]" />
 ) : null}
 </div>
 ))}
 </div>
 </div>
 ))}

 {isAdmin ? (
 <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm font-semibold text-[var(--text-primary)]">Admin</p>
 <p className="mt-0.5 text-xs text-[var(--text-muted)]">Internal tools</p>
 </div>
 <Link
 href="/admin/nutrition"
 className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
 >
 Admin tools →
 </Link>
 </div>
 </div>
 ) : null}

 <form action={logout}>
 <button
 type="submit"
 className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] py-3.5 text-sm font-semibold text-[var(--text-secondary)]"
 >
 Sign out
 </button>
 </form>

 <DeleteAccountSection email={email} />
 </div>
 </div>
 );
}

function Chevron() {
 return (
 <svg className="h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 );
}
