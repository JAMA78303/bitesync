"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ShoppingBasket } from "lucide-react";
import { CalorieRing } from "@/components/today/CalorieRing";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoalsStatusLegend } from "@/components/today/GoalsStatusLegend";
import { MacroBar } from "@/components/today/MacroBar";
import { getGoalStatus } from "@/lib/today/goal-status";
import { TodayMealCard } from "@/components/today/TodayMealCard";
import { MealThumbnail } from "@/components/ui/MealThumbnail";
import type { TodayMeal, TodayTotals } from "@/lib/planner/today";
import type { UserNutritionTargets } from "@/lib/utils/nutrition-targets";
import { MEAL_LABELS, type MealType } from "@/types";
import { formatLongDateWithOrdinal } from "@/lib/utils/dates";
import { ds } from "@/lib/ui/classes";

const MEAL_ORDER: MealType[] = ["breakfast","lunch","dinner","snack"];

type Props = {
 meals: TodayMeal[];
 totals: TodayTotals;
 targets: UserNutritionTargets;
 dietaryPreferences: string[];
 /** Landing capture — goals card only (ring + macro bars). */
 heroOnly?: boolean;
 /** Landing capture — ring + one macro bar (~260px crop). */
 compactHero?: boolean;
 /** Fixed date string for screenshot staging. */
 dateLabel?: string;
 /** Cards above today's meals: planning the coming week, reminders. */
 extras?: React.ReactNode;
};

export function TodayDashboard({
 meals,
 totals,
 targets,
 dietaryPreferences,
 heroOnly = false,
 compactHero = false,
 dateLabel,
 extras,
}: Props) {
 const remaining = Math.max(0, targets.kcal - totals.kcal);
 const calorieStatus = getGoalStatus("kcal", totals.kcal, targets.kcal);
 const headerDate = dateLabel ?? formatLongDateWithOrdinal(new Date());
 const weekdayName = new Date().toLocaleDateString("en-GB", { weekday: "long" });
 const orderedMeals = [...meals].sort(
 (a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType) || a.slotIndex - b.slotIndex,
 );
 // The first meal of the day not yet eaten or skipped.
 const nextMeal = orderedMeals.find((m) => m.status === "planned") ?? null;

 return (
 <div className={`${ds.mobilePage} ${compactHero ? "" : ds.pageContent}`}>
 {compactHero ? null : (
 <div className={`${ds.gradientHeader} flex flex-col gap-5 md:flex-row md:items-center md:justify-between`}>
 <div className="min-w-0">
 <span className={ds.kicker}>{headerDate}</span>
 {/* "Your Goals" collided with the /goals page, which is where targets are
 actually set — two different things sharing a name. This view is today's
 progress; the targets behind it are one tap away below. */}
 <h1 className={`mb-1.5 ${ds.pageTitle}`}>Today</h1>
 <p className={ds.pageSubtitle}>Your meals and targets for today, in one place.</p>
 </div>
 <Link href="/planner" className={`${ds.heroPrimaryBtn} w-full md:w-auto`}>
 Open weekly plan
 <ArrowRight className="h-4 w-4" aria-hidden />
 </Link>
 </div>
 )}

 <div className={compactHero ? "p-3" : `${ds.mobileGutter} ${ds.overlap}`}>
 <div
 className={
 compactHero || heroOnly || !nextMeal
 ? ""
 : "grid gap-4 md:grid-cols-[1.35fr_0.65fr]"
 }
 >
 <article className={`${compactHero ? "" : "mb-4 md:mb-0 "}${ds.card} ${compactHero ? "p-4" : "p-6"}`}>
 {compactHero ? null : (
 <div className="mb-5 flex items-start justify-between gap-3">
 <div>
 <span className={ds.sectionKicker}>TODAY&apos;S TARGET</span>
 <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
 {targets.kcal.toLocaleString("en-GB")} kcal
 </h2>
 </div>
 <span
 className={`shrink-0 rounded-full bg-[var(--surface-brand-subtle)] px-3 py-1.5 text-xs font-bold ${calorieStatus.textClassName}`}
 >
 {calorieStatus.label}
 </span>
 </div>
 )}
 <div className={`flex items-center gap-5 ${compactHero ? "mb-3" : "mb-6"}`}>
 <CalorieRing consumed={totals.kcal} target={targets.kcal} size={compactHero ? 80 : 100} />
 <div className="min-w-0">
 <p className={ds.statLabel}>Calories</p>
 <p className="font-display text-[32px] font-extrabold leading-none tracking-[-0.04em] tabular-nums text-[var(--text-primary)]">
 {Math.round(totals.kcal).toLocaleString("en-GB")}
 </p>
 <p className={`mt-1 ${ds.tierMeta}`}>of {targets.kcal.toLocaleString("en-GB")} kcal</p>
 <p className="mt-0.5 text-xs font-bold text-[var(--brand-primary)]">
 {remaining.toLocaleString("en-GB")} kcal remaining
 </p>
 </div>
 </div>

 {compactHero ? (
 <MacroBar metric="protein" label="Protein" value={totals.protein} target={targets.protein} unit="g" />
 ) : (
 <>
 <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[var(--border-subtle)] pt-5">
 <MacroBar metric="protein" label="Protein" value={totals.protein} target={targets.protein} unit="g" />
 <MacroBar metric="fibre" label="Fibre" value={totals.fibre} target={targets.fibre} unit="g" />
 <MacroBar metric="fat" label="Fat" value={totals.fat} target={targets.fat} unit="g" kcal={totals.kcal} />
 <MacroBar metric="carbs" label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" />
 </div>
 {/* On mobile /goals sits behind the "More" sheet, so the targets driving every
 number above were effectively undiscoverable. Put the way in next to them. */}
 <Link
 href="/goals"
 className="mt-5 flex items-center justify-between rounded-xl border border-[var(--border-default)] px-3.5 py-3 transition-colors hover:border-[var(--brand-primary)]"
 >
 <span className="min-w-0">
 <span className="block text-sm font-semibold text-[var(--text-primary)]">
 Adjust your targets
 </span>
 <span className="block text-xs text-[var(--text-muted)]">
 {targets.kcal} kcal · {targets.protein}g protein · {targets.carbs}g carbs · {targets.fat}g fat
 </span>
 </span>
 <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
 </Link>
 <GoalsStatusLegend />
 </>
 )}
 </article>

 {nextMeal && !compactHero && !heroOnly ? <UpNextCard meal={nextMeal} /> : null}
 </div>

 {extras && !heroOnly && !compactHero ? <div className="mt-6">{extras}</div> : null}

 {heroOnly ? null : (
 <section className="mb-4 mt-8">
 <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
 <div>
 <span className={ds.sectionKicker}>TODAY&apos;S MEALS</span>
 <h2 className={ds.sectionTitle}>Meals for {weekdayName}</h2>
 </div>
 {meals.length > 0 ? (
 <Link href="/grocery" className={`${ds.secondaryBtn} min-h-10 gap-1.5 px-3.5 py-2 text-xs`}>
 <ShoppingBasket className="h-3.5 w-3.5" aria-hidden />
 Grocery list
 </Link>
 ) : null}
 </div>

 {meals.length === 0 ? (
 <EmptyState
 icon={CalendarDays}
 title="Nothing planned for today"
 description="Plan your week and today's meals will show up here with your calorie ring and macros"
 action={{ href: "/planner", label: "Open planner" }}
 secondaryAction={{ href: "/sample-week", label: "See a sample week" }}
 className="py-12"
 />
 ) : (
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
 {orderedMeals.map((meal) => (
 <TodayMealCard key={meal.id} meal={meal} dietaryPreferences={dietaryPreferences} />
 ))}
 </div>
 )}
 </section>
 )}
 </div>
 </div>
 );
}

function UpNextCard({ meal }: { meal: TodayMeal }) {
 const name = meal.recipe?.name ?? meal.quickAddName ?? "Meal";
 const kcal = meal.recipe?.kcal ?? meal.quickAddCalories;
 return (
 <article className={`${ds.card} mb-4 flex flex-col p-6 md:mb-0`}>
 <span className={ds.sectionKicker}>UP NEXT</span>
 <MealThumbnail
 recipeName={name}
 mealType={meal.mealType}
 imageUrl={meal.recipe?.imageUrl}
 imageAlt={name}
 className="my-5"
 />
 <div className="flex-1">
 <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--brand-primary)]">
 {MEAL_LABELS[meal.mealType]}
 </p>
 <h3 className="mt-1 text-lg font-bold leading-snug text-[var(--text-primary)]">{name}</h3>
 {kcal != null ? (
 <p className={`mt-1 ${ds.tierMeta}`}>
 {Math.round(kcal)} kcal
 {meal.recipe ? ` · ${Math.round(meal.recipe.protein)}g protein` : ""}
 </p>
 ) : null}
 </div>
 {meal.recipe ? (
 <Link
 href={`/recipes/${encodeURIComponent(meal.recipe.id)}`}
 className={`${ds.secondaryBtn} mt-5 min-h-10 gap-1.5 py-2 text-xs`}
 >
 View recipe
 <ArrowRight className="h-3.5 w-3.5" aria-hidden />
 </Link>
 ) : null}
 </article>
 );
}
