"use client";

import Link from "next/link";
import { Heart, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleRecipeFavourite } from "@/app/(app)/recipes/actions";
import { getDietTag } from "@/lib/ui/dietTags";
import { getDietTagStyle } from "@/lib/ui/dietTagStyles";
import { getMealEmoji } from "@/lib/ui/mealThumbnails";
import { ds } from "@/lib/ui/classes";

export type RecipeListItem = {
  id: string;
  name: string;
  sourceDomain: string | null;
  kcal: number | null;
  protein: number | null;
  carbs: number;
  fat: number;
  imageUrl: string | null;
  isFavourite: boolean;
};

type Props = {
  recipe: RecipeListItem;
  dietaryPreferences?: string[];
  onQuickDelete?: (recipe: RecipeListItem) => void;
  quickDeleteDisabled?: boolean;
};

export function RecipeListCard({
  recipe,
  dietaryPreferences = [],
  onQuickDelete,
  quickDeleteDisabled = false,
}: Props) {
  const [isFavourite, setIsFavourite] = useState(recipe.isFavourite);
  const [isPending, startTransition] = useTransition();

  const dietTag =
    recipe.kcal != null
      ? getDietTag(recipe.kcal, recipe.protein ?? 0, recipe.carbs, recipe.fat, dietaryPreferences)
      : null;
  const emoji = getMealEmoji(recipe.name, "dinner");

  function handleToggleFavourite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFavourite;
    setIsFavourite(next);
    startTransition(async () => {
      const result = await toggleRecipeFavourite(recipe.id, next);
      if (result && "error" in result) {
        setIsFavourite(!next);
      }
    });
  }

  function handleQuickDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!onQuickDelete || quickDeleteDisabled) return;
    onQuickDelete(recipe);
  }

  return (
    <div className={`${ds.card} ${ds.cardPadding} relative flex items-center gap-3`}>
      <Link
        href={`/recipes/${recipe.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition-shadow hover:opacity-95"
      >
        <div className={ds.thumbnail}>
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.imageUrl} alt="" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <span>{emoji}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {dietTag ? (
            <span
              className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getDietTagStyle(dietTag)}`}
            >
              {dietTag}
            </span>
          ) : null}
          <p className={`${ds.cardTitle} truncate`}>{recipe.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {recipe.kcal != null ? (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span aria-hidden>🔥</span>
                <span className="font-medium text-gray-600 dark:text-gray-400">{Math.round(recipe.kcal)}</span>
                <span>kcal</span>
              </span>
            ) : null}
            {recipe.protein != null ? (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span aria-hidden>🌿</span>
                <span className="font-medium text-gray-600 dark:text-gray-400">{Math.round(recipe.protein)}g</span>
                <span>protein</span>
              </span>
            ) : null}
            {recipe.sourceDomain ? (
              <span className="truncate text-xs text-gray-300 dark:text-gray-600">· {recipe.sourceDomain}</span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="flex flex-shrink-0 flex-col items-center gap-3 pl-1">
        {onQuickDelete ? (
          <button
            type="button"
            onClick={handleQuickDelete}
            disabled={quickDeleteDisabled}
            aria-label={`Delete ${recipe.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleToggleFavourite}
          disabled={isPending}
          aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
          aria-pressed={isFavourite}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            isFavourite
              ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              : "text-gray-300 hover:bg-gray-50 hover:text-red-400 dark:text-gray-600 dark:hover:bg-gray-800"
          }`}
        >
          <Heart className={`h-5 w-5 ${isFavourite ? "fill-current" : ""}`} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
