"use client";

import Link from "next/link";
import { Heart, X, Flame, Leaf } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleRecipeFavourite } from "@/app/(app)/recipes/actions";
import { MealThumbnail } from "@/components/ui/MealThumbnail";
import { getDietTag } from "@/lib/ui/dietTags";
import { getDietTagStyle } from "@/lib/ui/dietTagStyles";
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

 function handleToggleFavourite(e: React.MouseEvent) {
 e.preventDefault();
 e.stopPropagation();
 const next = !isFavourite;
 setIsFavourite(next);
 startTransition(async () => {
 const result = await toggleRecipeFavourite(recipe.id, next);
 if (result &&"error" in result) {
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
 <MealThumbnail recipeName={recipe.name} mealType="dinner" imageUrl={recipe.imageUrl} />

 <div className="min-w-0 flex-1">
 {dietTag ? (
 <span
 className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getDietTagStyle(dietTag)}`}
 >
 {dietTag}
 </span>
 ) : null}
 <p className={`${ds.cardTitle} truncate`}>{recipe.name}</p>
 <div className="mt-1.5 flex flex-wrap items-center gap-3">
 {recipe.kcal != null ? (
 <span className="flex items-baseline gap-1">
 <Flame className="h-3.5 w-3.5 shrink-0 text-[var(--brand-action)]" aria-hidden />
 <span className={ds.statValueSm}>{Math.round(recipe.kcal)}</span>
 <span className={ds.tierMeta}>kcal</span>
 </span>
 ) : null}
 {recipe.protein != null ? (
 <span className="flex items-baseline gap-1">
 <Leaf className="h-3.5 w-3.5 shrink-0 text-[var(--brand-action)]" aria-hidden />
 <span className={ds.statValueSm}>{Math.round(recipe.protein)}g</span>
 <span className={ds.tierMeta}>protein</span>
 </span>
 ) : null}
 {recipe.sourceDomain ? (
 <span className={`truncate ${ds.tierMeta}`}>· {recipe.sourceDomain}</span>
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
 className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--semantic-error-bg)] hover:text-[var(--semantic-error-text)] disabled:opacity-40"
 >
 <X className="h-5 w-5" strokeWidth={2.25} />
 </button>
 ) : null}
 <button
 type="button"
 onClick={handleToggleFavourite}
 disabled={isPending}
 aria-label={isFavourite ?"Remove from favourites" :"Add to favourites"}
 aria-pressed={isFavourite}
 className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
 isFavourite
 ?"text-[var(--traffic-red)] hover:bg-[var(--semantic-error-bg)]"
 :"text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--traffic-red)]"
 }`}
 >
 <Heart className={`h-5 w-5 ${isFavourite ?"fill-current" :""}`} strokeWidth={2} />
 </button>
 </div>
 </div>
 );
}
