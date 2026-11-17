import { redirect } from "next/navigation";
import { FastingTodayCards, type FastingTodayInfo } from "@/components/fasting/FastingTodayCards";
import { TrialStatusCard } from "@/components/billing/TrialStatusCard";
import { TodayDashboard } from "@/components/today/TodayDashboard";
import { UpcomingWeekCard } from "@/components/habit/UpcomingWeekCard";
import { WeeklyHabitCard } from "@/components/habit/WeeklyHabitCard";
import { WeekStatsCard } from "@/components/today/WeekStatsCard";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import { fastingModeVisible } from "@/lib/fasting/access";
import { expectedRamadan, ramadanOfferOpen } from "@/lib/fasting/hijri";
import { daysBetweenISO, formatClock, formatShortDate, weekdayIndexISO } from "@/lib/fasting/isoDate";
import { getFastingSettings } from "@/lib/fasting/server";
import {
  daysSinceRamadanEnded,
  fastingDayTargets,
  isFastingDay,
  isRamadanDay,
  ramadanRange,
  timesForDay,
  type FastingSettings,
} from "@/lib/fasting/settings";
import { getTodaysMeals, sumTodayTotals, type TodayMeal } from "@/lib/planner/today";
import { upcomingWeekStatus } from "@/lib/planner/upcoming-weeks";
import { computeWeeklyMacrosFromEntries, type DayMacros } from "@/lib/planner/weekly-macros";
import { getMealPlanEntries } from "@/lib/supabase/meal-plans";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/subscription";
import { nativeWithoutPurchases } from "@/lib/native/server";
import { photoLoggingVisible } from "@/lib/photoMeal/access";
import { summariseWeek } from "@/lib/today/week-stats";
import { getMonday, toLocalISO } from "@/lib/utils/dates";
import { deriveNutritionTargets } from "@/lib/utils/nutrition-targets";

export const dynamic ="force-dynamic";

type Props = {
 /** `plan=upcoming` comes from the Sunday reminder: plan the week on arrival. */
 searchParams: Promise<{ plan?: string }>;
};

export default async function TodayPage({ searchParams }: Props) {
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();
 if (!user) redirect("/login");

 // This week's days, the same figures the Nutrition page shows for it.
 const weekStart = getMonday(new Date());
 const thisWeekDays = async (): Promise<DayMacros[]> => {
  const { data: plan } = await supabase
   .from("meal_plans")
   .select("id")
   .eq("user_id", user.id)
   .eq("week_start_date", toLocalISO(weekStart))
   .maybeSingle();
  const { data: entries } = plan ? await getMealPlanEntries(plan.id) : { data: [] };
  return computeWeeklyMacrosFromEntries(entries ?? [], weekStart).days;
 };

 const [meals, profile, upcoming, weekDays, params, access, native, photoLogging, fastingSettings] = await Promise.all([
  getTodaysMeals(user.id).catch((error) => {
   console.error("[today] getTodaysMeals failed", error);
   return [];
  }),
  getProfile().catch((error) => {
   console.error("[today] getProfile failed", error);
   return null;
  }),
  upcomingWeekStatus(supabase, user.id, new Date()).catch((error) => {
   console.error("[today] upcomingWeekStatus failed", error);
   return null;
  }),
  thisWeekDays().catch((error) => {
   console.error("[today] thisWeekDays failed", error);
   return null;
  }),
  searchParams,
  getAccess(),
  nativeWithoutPurchases(),
  photoLoggingVisible(user.id).catch(() => false),
  getFastingSettings(supabase, user.id),
 ]);
 // The same calendar day getTodaysMeals reads.
 const todayISO = toLocalISO(new Date());
 const fasting = isFastingDay(fastingSettings, todayISO);
 const normalTargets = deriveNutritionTargets(profile);
 const targets = fasting ? fastingDayTargets(profile, fastingSettings, normalTargets) : normalTargets;
 const totals = sumTodayTotals(meals);
 // Not released yet (lib/fasting/access.ts): no cards, including the Ramadan offer.
 const fastingCards = fastingModeVisible(user.id)
  ? fastingTodayCards(fastingSettings, todayISO, meals, targets.kcal !== normalTargets.kcal)
  : null;
 const dietaryPreferences = initialDietaryPreferencesFromProfile(profile);
 // A trial that has ended can't plan (lib/billing/access.ts), so no one-tap
 // week, no auto-plan from the Sunday reminder link, and no offer of a
 // reminder to plan: the trial card says why instead.
 const canPlan = access?.canPlan !== false;
 // Snap a meal: the reference intakes behind its vitamin and mineral summary.
 const photoPerson = photoLogging
  ? { sex: profile?.sex === "female" ? ("female" as const) : ("male" as const), age: profile?.age ?? null }
  : null;

 return (
 <TodayDashboard
 meals={meals}
 totals={totals}
 targets={targets}
 dietaryPreferences={dietaryPreferences}
 photoPerson={photoPerson}
 fasting={fasting}
 extras={
 <>
 {fastingCards ? <FastingTodayCards {...fastingCards} /> : null}
 {access ? <TrialStatusCard access={access} native={native} /> : null}
 {upcoming?.isEmpty && canPlan ? (
 <UpcomingWeekCard
 weekStart={upcoming.weekStart}
 isNextWeek={upcoming.isNextWeek}
 autoStart={params.plan === "upcoming"}
 />
 ) : null}
 {weekDays ? <WeekStatsCard stats={summariseWeek(weekDays, targets)} /> : null}
 {canPlan ? <WeeklyHabitCard placement="today" /> : null}
 </>
 }
 />
 );
}

const WEEKDAY_FAST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * What Today shows about fasting: today's times and tips on a fasting day,
 * the "Fasting today" switch, the Ramadan offer from six weeks before, and
 * "Back to normal meals?" in the week after Eid. Null when there's nothing.
 */
function fastingTodayCards(
 s: FastingSettings | null,
 todayISO: string,
 meals: TodayMeal[],
 noDeficitApplied: boolean,
): React.ComponentProps<typeof FastingTodayCards> | null {
 let fasting: FastingTodayInfo | null = null;
 const ramadanToday = isRamadanDay(s, todayISO);
 const weeklyToday = !!s && !ramadanToday && s.weeklyDays.includes(weekdayIndexISO(todayISO));
 if (s && isFastingDay(s, todayISO)) {
  const range = ramadanRange(s, todayISO);
  const times = timesForDay(s, todayISO);
  fasting = {
   title: ramadanToday && range
    ? `Ramadan · day ${daysBetweenISO(range.start, todayISO) + 1}`
    : weeklyToday && !s.extraDays.includes(todayISO)
     ? `${WEEKDAY_FAST[weekdayIndexISO(todayISO)]} fast`
     : "Fasting today",
   suhoorEnds: times ? formatClock(times.fajr, s.timeZone) : null,
   iftarAt: times ? formatClock(times.maghrib, s.timeZone) : null,
   lunchPlanned: meals.some((m) => m.mealType === "lunch" && m.status !== "skipped"),
   noDeficit: noDeficitApplied,
  };
 }

 // Only for people who've set fasting up, and not on days already fasting for another reason.
 const toggle = s && !ramadanToday && !(weeklyToday && !s.extraDays.includes(todayISO))
  ? { on: s.extraDays.includes(todayISO) }
  : null;

 const expected = expectedRamadan(todayISO);
 const offer =
  expected && !s?.ramadanOn && ramadanOfferOpen(todayISO, expected)
   ? { start: expected.start, startLabel: formatShortDate(expected.start), daysToStart: daysBetweenISO(todayISO, expected.start) }
   : null;

 const afterEid = !!s?.ramadanOn && daysSinceRamadanEnded(s, todayISO) != null;

 if (!fasting && !toggle && !offer && !afterEid) return null;
 return { todayISO, fasting, toggle, offer, afterEid };
}
