import Link from "next/link";
import { CreditCard, FileText, KeyRound, Mail, ShieldCheck, Target } from "lucide-react";
import { RowIcon } from "@/components/ui/RowIcon";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { SettingsThemeRow } from "@/components/settings/SettingsThemeRow";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { getAccess, isProSubscriptionStatus } from "@/lib/subscription";
import { reconcileBillingSubscriptionFromStripe } from "@/lib/stripe/reconcile-billing-subscription";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { ds } from "@/lib/ui/classes";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/support";

export const dynamic ="force-dynamic";

const SETTINGS_GROUPS = [
 {
 title:"Account",
 items: [
 { icon: CreditCard, label:"Billing & subscription", href:"/billing" },
 { icon: KeyRound, label:"Change password", href:"/reset" },
 ],
 },
 {
 title:"Help",
 items: [
 {
 icon: Mail,
 label:`Contact support · ${SUPPORT_EMAIL}`,
 href: supportMailto(),
 external: true,
 },
 ],
 },
 {
 title:"About",
 items: [
 { icon: ShieldCheck, label:"Privacy policy", href:"/privacy" },
 { icon: FileText, label:"Terms of service", href:"/terms" },
 ],
 },
] as const;

export default async function SettingsPage() {
 const supabase = await createClient();
 const [initialProfile, auth, access] = await Promise.all([getProfile(), supabase.auth.getUser(), getAccess()]);
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

 // Paying through Stripe (maybe only just reconciled above, after getAccess
 // ran) counts as Pro; otherwise the plan comes from lib/billing/access.ts.
 const plan = isProSubscriptionStatus(profile?.subscription_status) ? "pro" : (access?.plan ?? "free");
 const hasPro = plan === "pro" || plan === "trial";
 const days = access?.trialDaysLeft ?? 1;
 const planLabel = {
 pro: "✦ Pro",
 trial: `✦ Pro trial · ${days} ${days === 1 ? "day" : "days"} left`,
 free: "Free plan",
 expired: "Trial ended",
 }[plan];
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
 <div className={ds.gradientHeader}>
 <span className={ds.kicker}>YOUR ACCOUNT</span>
 <h1 className={`mb-1.5 ${ds.pageTitle}`}>Settings</h1>
 <p className={ds.pageSubtitle}>Profile, preferences, billing and support.</p>
 </div>

 <div className={`${ds.mobileGutter} space-y-4 ${ds.pageContent}`}>
 <div className={`${ds.card} mb-4 flex items-center gap-4 ${ds.cardPadding}`}>
 <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--green-deep)] font-display text-xl font-bold text-white dark:bg-[var(--accent-lime)] dark:text-[var(--on-lime)]">
 {initial}
 </div>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-bold text-[var(--text-primary)]">{email}</p>
 <span
 className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
 hasPro ?"bg-[var(--accent-lime)] text-[var(--on-lime)]" :"bg-[var(--surface-brand-subtle)] text-[var(--brand-primary)]"
 }`}
 >
 {planLabel}
 </span>
 </div>
 </div>

 <div>
 <p className={`${ds.label} mb-2 px-1`}>App</p>
 <div className={`${ds.card} overflow-hidden`}>
 <SettingsThemeRow />
 </div>
 </div>

 <NotificationSettings vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />

 <Link
 href="/goals"
 className={`${ds.card} flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-muted)] `}
 >
 <RowIcon Icon={Target} />
 <span className="flex-1">
 <span className="block text-sm font-semibold text-[var(--text-primary)]">Nutrition &amp; goals</span>
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
 <RowIcon Icon={item.icon} />
 <span className="flex-1 text-sm font-semibold text-[var(--text-primary)]">
 {item.label}
 </span>
 <Chevron />
 </a>
 ) : (
 <Link
 href={item.href}
 className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-muted)]"
 >
 <RowIcon Icon={item.icon} />
 <span className="flex-1 text-sm font-semibold text-[var(--text-primary)]">
 {item.label}
 </span>
 <Chevron />
 </Link>
 )}
 {i < group.items.length - 1 ? (
 <div className="ml-[68px] h-px bg-[var(--border-subtle)]" />
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

 <SignOutButton />

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
