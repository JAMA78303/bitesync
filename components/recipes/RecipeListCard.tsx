import Link from "next/link";
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
};

type Props = {
  recipe: RecipeListItem;
  dietaryPreferences?: string[];
};

export function RecipeListCard({ recipe, dietaryPreferences = [] }: Props) {
  const dietTag =
    recipe.kcal != null
      ? getDietTag(recipe.kcal, recipe.protein ?? 0, recipe.carbs, recipe.fat, dietaryPreferences)
      : null;
  const emoji = getMealEmoji(recipe.name, "dinner");

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className={`${ds.card} ${ds.cardPadding} flex items-center gap-3 transition-shadow hover:shadow-md`}
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

      <svg
        className="h-4 w-4 flex-shrink-0 text-gray-300 dark:text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
