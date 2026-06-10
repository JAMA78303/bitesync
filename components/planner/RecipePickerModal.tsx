"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { assignRecipeToSlot } from "@/lib/supabase/meal-plans";
import { useToast } from "@/components/ui/use-toast";
import { recipeDietWarnings, type ProfileDietPrefs } from "@/lib/utils/diet";
import { recipeMatchesPlannerSlot } from "@/lib/planner/meal-slot-eligibility";
import { formatWeekdayWithOrdinal } from "@/lib/utils/dates";
import type { MealType } from "@/types";

type Recipe = {
 id: string;
 name: string;
 calories?: number | null;
 fits_vegetarian?: boolean | null;
 fits_vegan?: boolean | null;
 fits_gluten_free?: boolean | null;
 ingredientNames?: string[];
};
type Props = {
 open: boolean;
 onClose: () => void;
 mealPlanId: string;
 day: number | null;
 mealType: MealType | null;
 slotIndex?: number | null;
 recipes: Recipe[];
 dietPrefs?: ProfileDietPrefs | null;
 onAssigned: () => void;
 weekDates?: Date[];
};

export function RecipePickerModal({
 open,
 onClose,
 mealPlanId,
 day,
 mealType,
 slotIndex,
 recipes,
 dietPrefs,
 onAssigned,
 weekDates,
}: Props) {
 const [query, setQuery] = useState("");
 const [isPending, startTransition] = useTransition();
 const [assigningId, setAssigningId] = useState<string | null>(null);
 const { toast } = useToast();
 const router = useRouter();

 const slotRecipes = useMemo(() => {
 if (!mealType) return recipes;
 return recipes.filter((r) =>
 recipeMatchesPlannerSlot(r.name, r.ingredientNames ?? [], mealType, r.calories ?? null),
 );
 }, [recipes, mealType]);

 const filtered = slotRecipes.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
 const recipeSuggestions = slotRecipes
 .map((recipe) => recipe.name)
 .sort((a, b) => a.localeCompare(b));

 function handleSelect(recipe: Recipe) {
 if (day === null || !mealType) return;
 setAssigningId(recipe.id);
 startTransition(async () => {
 const result = await assignRecipeToSlot(mealPlanId, recipe.id, day, mealType, slotIndex ?? 0);
 setAssigningId(null);
 if (result?.error) {
 toast({
 title:"Failed to assign recipe",
 description: result.error,
 variant:"destructive",
 });
 return;
 }
 onClose();
 onAssigned();
 router.refresh();
 });
 }

 const title =
 day !== null && mealType
 ? `${weekDates?.[day] ? formatWeekdayWithOrdinal(weekDates[day]) : `Day ${day + 1}`} — ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`
 :"Add meal";

 return (
 <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
 <DialogContent>
 <DialogHeader>
 <div className="flex items-center justify-between">
 <DialogTitle>{title}</DialogTitle>
 <button
 type="button"
 onClick={onClose}
 aria-label="Close recipe picker"
 className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--btn-secondary-hover)] hover:text-[var(--text-secondary)]"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 </DialogHeader>

 <div className="relative mb-3">
 <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
 <Input
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search recipes..."
 className="h-9 pl-9 text-sm"
 list="planner-recipe-suggestions"
 autoComplete="off"
 autoFocus
 />
 </div>
 <datalist id="planner-recipe-suggestions">
 {recipeSuggestions.map((name) => (
 <option key={name} value={name} />
 ))}
 </datalist>

 <div className="max-h-[60vh] overflow-y-auto rounded-md border border-[var(--border-default)]">
 {recipes.length === 0 ? (
 <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
 <p>No recipes yet</p>
 <button
 onClick={() => {
 onClose();
 router.push("/recipes/new");
 }}
 className="mt-2 font-medium text-[var(--brand-primary)] hover:underline"
 >
 Create your first recipe →
 </button>
 </div>
 ) : slotRecipes.length === 0 ? (
 <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
 <p>No recipes in your library match this meal slot yet.</p>
 <p className="mt-2 text-xs text-[var(--text-muted)]">
 Breakfast expects foods like oats, eggs, yoghurt; lunch/dinner expect mains (curry, pasta, etc.).
 </p>
 </div>
 ) : filtered.length === 0 ? (
 <p className="p-4 text-center text-sm text-[var(--text-secondary)]">No recipes match &quot;{query}&quot;</p>
 ) : (
 filtered.map((recipe) => {
 const warnings =
 dietPrefs != null
 ? recipeDietWarnings(dietPrefs, {
 fits_vegetarian: recipe.fits_vegetarian ?? null,
 fits_vegan: recipe.fits_vegan ?? null,
 fits_gluten_free: recipe.fits_gluten_free ?? null,
 })
 : [];
 return (
 <button
 key={recipe.id}
 type="button"
 onClick={() => handleSelect(recipe)}
 disabled={isPending}
 className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-100 hover:bg-[var(--surface-brand-subtle)] disabled:opacity-50"
 >
 <div className="min-w-0 pr-2">
 <p className="text-sm font-medium text-[var(--text-primary)]">{recipe.name}</p>
 {recipe.calories != null ? (
 <p className="text-xs text-[var(--text-muted)]">{Math.round(recipe.calories)} kcal</p>
 ) : null}
 {warnings.length > 0 ? (
 <p className="mt-0.5 text-[11px] text-amber-700">{warnings.join(" ·")}</p>
 ) : null}
 </div>
 <span className="shrink-0 text-xs text-[var(--text-muted)]">
 {assigningId === recipe.id ?"Adding..." : <Plus className="h-4 w-4" />}
 </span>
 </button>
 );
 })
 )}
 </div>
 <div className="mt-3 flex justify-end">
 <button
 type="button"
 onClick={onClose}
 className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
 >
 Cancel
 </button>
 </div>
 </DialogContent>
 </Dialog>
 );
}
