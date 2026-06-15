"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { RankedRecipeMatch, SuggestMealsResult } from "@/lib/matching/suggest-meals";
import { ds } from "@/lib/ui/classes";

type Props = {
 title: string;
 emptyHint: string;
 onSuggest: () => Promise<{ error?: string; data?: SuggestMealsResult }>;
 sourceLabel: string;
};

function MatchList({ matches }: { matches: RankedRecipeMatch[] }) {
 if (!matches.length) return null;

 return (
 <ul className="space-y-2">
 {matches.map((match) => (
 <li key={match.recipeId}>
 <Link
 href={`/recipes/${match.recipeId}`}
 className={`${ds.card} block ${ds.cardPadding} transition hover:shadow-md`}
 >
 <p className={`${ds.cardTitle} mb-1`}>{match.recipeName}</p>
 <p className="text-xs font-medium text-[var(--brand-primary)]">{match.overlapLabel}</p>
 {match.missingIngredients.length > 0 ? (
 <p className="mt-1 text-2xs text-[var(--text-muted)]">
 Still need: {match.missingIngredients.slice(0, 3).join(",")}
 {match.missingIngredients.length > 3 ?"…" :""}
 </p>
 ) : null}
 </Link>
 </li>
 ))}
 </ul>
 );
}

export function MealMatchSuggestions({ title, emptyHint, onSuggest, sourceLabel }: Props) {
 const [result, setResult] = useState<SuggestMealsResult | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [isPending, startTransition] = useTransition();

 function handleSuggest() {
 setError(null);
 startTransition(async () => {
 const response = await onSuggest();
 if (response.error) {
 setError(response.error);
 setResult(null);
 return;
 }
 setResult(response.data ?? null);
 });
 }

 return (
 <section className={`${ds.card} ${ds.cardPadding}`}>
 <div className="mb-3 flex items-start justify-between gap-3">
 <div>
 <h2 className="text-sm font-bold text-[var(--text-primary)]">{title}</h2>
 <p className="mt-0.5 text-xs text-[var(--text-muted)]">{sourceLabel}</p>
 </div>
 <button
 type="button"
 onClick={handleSuggest}
 disabled={isPending}
 className={`${ds.primaryBtn} shrink-0 px-4 py-2 text-xs disabled:opacity-60`}
 >
 {isPending ?"Matching…" :"Suggest meals"}
 </button>
 </div>

 {error ? <p className={`text-sm ${ds.errorText}`}>{error}</p> : null}

 {!result && !error ? (
 <p className="text-xs text-[var(--text-muted)]">{emptyHint}</p>
 ) : null}

 {result?.usedFallback ? (
 <div className="space-y-2">
 <p className="text-xs text-[var(--semantic-warn-text)]">
 No strong overlap with {result.availableCount} ingredient
 {result.availableCount === 1 ?"" :"s"} — here are recipes from your library to try:
 </p>
 <MatchList matches={result.fallbackRecipes} />
 </div>
 ) : null}

 {result && !result.usedFallback ? <MatchList matches={result.matches} /> : null}
 </section>
 );
}
