import Link from "next/link";
import { Lock } from "lucide-react";
import { logout } from "@/app/(app)/settings/actions";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { TDEEForm } from "@/components/settings/TDEEForm";
import { DietPreferencesForm } from "@/components/settings/DietPreferencesForm";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { reconcileBillingSubscriptionFromStripe } from "@/lib/stripe/reconcile-billing-subscription";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  let [profile, auth] = await Promise.all([getProfile(), supabase.auth.getUser()]);
  const {
    data: { user },
  } = auth;

  if (
    user &&
    profile &&
    !isProSubscriptionStatus(profile.subscription_status)
  ) {
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

  const defaultValues = profile?.weight_kg
    ? {
        weightKg: Number(profile.weight_kg),
        heightCm: Number(profile.height_cm),
        age: Number(profile.age),
        sex: profile.sex as "male" | "female",
        activityLevel: profile.activity_level as "sedentary" | "light" | "moderate" | "active" | "extra_active",
        goal: profile.goal as "lose" | "maintain" | "gain",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-400">Manage your account and nutrition targets</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ThemeToggle />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Diet preferences</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Tag how you eat — used when planning meals and labeling recipes
          </p>
        </div>
        <DietPreferencesForm
          initialValues={{
            followsVegetarian: Boolean(profile?.follows_vegetarian),
            followsVegan: Boolean(profile?.follows_vegan),
            followsGlutenFree: Boolean(profile?.follows_gluten_free),
          }}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Calorie and protein targets</h2>
            <p className="mt-0.5 text-xs text-slate-400">Based on your body stats and goal</p>
          </div>
          {!isPro ? (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              <Lock className="h-3 w-3" />
              Pro
            </span>
          ) : null}
        </div>

        {isPro ? (
          <TDEEForm defaultValues={defaultValues} />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mb-1 text-sm font-medium text-slate-600">Pro feature</p>
            <p className="mb-4 text-xs text-slate-400">
              Set calorie and protein targets based on body stats, activity level, and goal.
            </p>
            <Link
              href="/billing"
              className="inline-block rounded-lg bg-[#1A4731] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#153928]"
            >
              Upgrade to Pro
            </Link>
            {profile?.stripe_customer_id ? (
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Already paid? Open{" "}
                <Link
                  href="/billing"
                  className="font-medium text-[#1A4731] underline underline-offset-2"
                >
                  Billing
                </Link>{" "}
                and use &quot;Sync subscription from Stripe&quot; so Pro unlocks here.
              </p>
            ) : null}
          </div>
        )}
      </div>

      {isPro && profile?.daily_calorie_target ? (
        <div className="rounded-xl border border-[#6EE7B7] bg-[#F0FDF4] p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Current targets</p>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-slate-400">Calories</p>
              <p className="text-lg font-bold text-[#1A4731]">{profile.daily_calorie_target} kcal/day</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Protein</p>
              <p className="text-lg font-bold text-[#1A4731]">{profile.daily_protein_target} g/day</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Subscription</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Manage your plan and billing
            </p>
          </div>
          <Link
            href="/billing"
            className="text-xs font-medium text-[#1A4731] hover:underline"
          >
            Manage →
          </Link>
        </div>
      </div>

      {isAdmin ? (
        <div className="mt-4 rounded-xl bg-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="mt-0.5 text-xs text-slate-400">Internal tools</p>
            </div>
            <Link href="/admin/prices" className="text-xs text-slate-300 transition-colors hover:text-white">
              Price manager →
            </Link>
          </div>
        </div>
      ) : null}

      <form action={logout}>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
