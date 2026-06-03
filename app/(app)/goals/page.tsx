import Link from "next/link";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { getProfile } from "@/lib/supabase/profile";
import { deriveNutritionTargets, hasCompleteTdeeProfile } from "@/lib/utils/nutrition-targets";
import { ds } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

const GOALS_ITEMS = [
  {
    icon: "🌿",
    label: "Dietary preferences",
    desc: "Vegetarian, vegan, gluten-free — used for AI meal plans",
    href: "/goals/dietary",
  },
  {
    icon: "🎯",
    label: "Calorie & macro targets",
    desc: "Body stats, activity, and daily goals from TDEE",
    href: "/goals/targets",
    pro: true,
  },
] as const;

export default async function GoalsPage() {
  const profile = await getProfile();
  const isPro = isProSubscriptionStatus(profile?.subscription_status);
  const targets = deriveNutritionTargets(profile);

  return (
    <div className="-mx-4 min-h-screen bg-gray-50 dark:bg-gray-950 md:mx-0">
      <div className="bg-gradient-to-b from-[#3a5a40] to-[#4a7a50] px-4 pt-14 pb-10">
        <h1 className="text-xl font-bold text-white">Nutrition &amp; goals</h1>
        <p className="mt-0.5 text-sm text-white/60">
          Diet preferences and daily targets that power your planner and macros
        </p>
        {hasCompleteTdeeProfile(profile) ? (
          <p className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
            Current target: {targets.kcal} kcal · {targets.protein}g protein / day
          </p>
        ) : null}
      </div>

      <div className="space-y-4 px-4 -mt-6 pb-28">
        <div className={`${ds.card} overflow-hidden`}>
          {GOALS_ITEMS.map((item, i) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="w-7 text-center text-lg">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                    {"pro" in item && item.pro && !isPro ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Pro
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">{item.desc}</span>
                </span>
                <Chevron />
              </Link>
              {i < GOALS_ITEMS.length - 1 ? (
                <div className="ml-14 h-px bg-gray-50 dark:bg-gray-800" />
              ) : null}
            </div>
          ))}
        </div>

        <Link
          href="/settings"
          className={`${ds.card} flex items-center justify-between px-4 py-3.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800`}
        >
          <span>Account &amp; app settings</span>
          <Chevron />
        </Link>
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
