"use client";

import { useState, useTransition } from "react";
import { Search, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { assignRecipeToSlot } from "@/lib/supabase/meal-plans";
import { useToast } from "@/components/ui/use-toast";
import { recipeDietWarnings, type ProfileDietPrefs } from "@/lib/utils/diet";
import { DAY_NAMES } from "@/types";
import type { MealType } from "@/types";

type Recipe = {
  id: string;
  name: string;
  calories?: number | null;
  fits_vegetarian?: boolean | null;
  fits_vegan?: boolean | null;
  fits_gluten_free?: boolean | null;
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
}: Props) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const filtered = recipes.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
  const recipeSuggestions = recipes
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
          title: "Failed to assign recipe",
          description: result.error,
          variant: "destructive",
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
      ? `${DAY_NAMES[day]} — ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`
      : "Add meal";

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
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
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

        <div className="max-h-[60vh] overflow-y-auto rounded-md border border-gray-200">
          {recipes.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-600">
              <p>No recipes yet</p>
              <button
                onClick={() => {
                  onClose();
                  router.push("/recipes/new");
                }}
                className="mt-2 font-medium text-[#1A4731] hover:underline"
              >
                Create your first recipe →
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-600">No recipes match &quot;{query}&quot;</p>
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
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-100 hover:bg-[#F0FDF4] disabled:opacity-50"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-medium text-gray-900">{recipe.name}</p>
                    {recipe.calories != null ? (
                      <p className="text-xs text-gray-500">{Math.round(recipe.calories)} kcal</p>
                    ) : null}
                    {warnings.length > 0 ? (
                      <p className="mt-0.5 text-[11px] text-amber-700">{warnings.join(" · ")}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-gray-500">
                    {assigningId === recipe.id ? "Adding..." : <Plus className="h-4 w-4" />}
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
            className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
