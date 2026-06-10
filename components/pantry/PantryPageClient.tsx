"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MealMatchSuggestions } from "@/components/matching/MealMatchSuggestions";
import {
 addPantryItemsFromText,
 addPantryStaple,
 deletePantryItem,
 seedCommonPantryStaples,
 setPantryRunningLow,
 suggestMealsFromPantry,
} from "@/app/(app)/pantry/actions";
import { PANTRY_STAPLES, type PantryItemRow } from "@/lib/pantry/constants";
import { ds } from "@/lib/ui/classes";

type Props = {
 items: PantryItemRow[];
};

export function PantryPageClient({ items }: Props) {
 const router = useRouter();
 const [bulkText, setBulkText] = useState("");
 const [isPending, startTransition] = useTransition();

 function refresh() {
 router.refresh();
 }

 function handleBulkAdd() {
 if (!bulkText.trim()) return;
 startTransition(async () => {
 await addPantryItemsFromText(bulkText);
 setBulkText("");
 refresh();
 });
 }

 function handleStaple(name: string) {
 startTransition(async () => {
 await addPantryStaple(name);
 refresh();
 });
 }

 function handleSeedStaples() {
 startTransition(async () => {
 await seedCommonPantryStaples();
 refresh();
 });
 }

 function handleRemove(id: string) {
 startTransition(async () => {
 await deletePantryItem(id);
 refresh();
 });
 }

 function handleToggleLow(id: string, next: boolean) {
 startTransition(async () => {
 await setPantryRunningLow(id, next);
 refresh();
 });
 }

 const existing = new Set(items.map((item) => item.name.toLowerCase()));
 const quickStaples = PANTRY_STAPLES.filter((name) => !existing.has(name.toLowerCase())).slice(0, 8);

 return (
 <div className="space-y-4">
 <div className={`${ds.card} ${ds.cardPadding} space-y-3`}>
 <h2 className="text-sm font-bold text-[var(--text-primary)]">Quick add</h2>
 <p className="text-xs text-[var(--text-muted)]">
 Type what you have — comma-separated works: chicken, rice, broccoli, eggs
 </p>
 <textarea
 value={bulkText}
 onChange={(e) => setBulkText(e.target.value)}
 rows={2}
 placeholder="chicken, rice, broccoli, eggs…"
 className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
 />
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 onClick={handleBulkAdd}
 disabled={isPending || !bulkText.trim()}
 className={`${ds.primaryBtn} px-4 py-2 text-sm disabled:opacity-60`}
 >
 Add to pantry
 </button>
 <button
 type="button"
 onClick={handleSeedStaples}
 disabled={isPending}
 className="rounded-xl border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-60"
 >
 Add common staples
 </button>
 </div>
 {quickStaples.length > 0 ? (
 <div className="flex flex-wrap gap-1.5 pt-1">
 {quickStaples.map((name) => (
 <button
 key={name}
 type="button"
 onClick={() => handleStaple(name)}
 disabled={isPending}
 className="rounded-full border border-[var(--border-default)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] disabled:opacity-60"
 >
 + {name}
 </button>
 ))}
 </div>
 ) : null}
 </div>

 <div className={`${ds.card} ${ds.cardPadding}`}>
 <h2 className="mb-3 text-sm font-bold text-[var(--text-primary)]">
 In your pantry ({items.length})
 </h2>
 {items.length === 0 ? (
 <p className="text-sm text-[var(--text-muted)]">Nothing here yet — add a few staples above.</p>
 ) : (
 <ul className="space-y-2">
 {items.map((item) => (
 <li
 key={item.id}
 className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] px-3 py-2"
 >
 <div className="min-w-0">
 <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
 {item.quantity != null && item.unit ? (
 <p className="text-xs text-[var(--text-muted)]">
 {item.quantity} {item.unit}
 </p>
 ) : null}
 </div>
 <div className="flex shrink-0 items-center gap-2">
 <button
 type="button"
 onClick={() => handleToggleLow(item.id, !item.running_low)}
 disabled={isPending}
 title="Mark running low"
 className={`rounded-full px-2 py-0.5 text-2xs font-medium ${
 item.running_low
 ?"bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
 :"bg-[var(--surface-muted)] text-[var(--text-muted)]"
 }`}
 >
 {item.running_low ?"Low" :"OK"}
 </button>
 <button
 type="button"
 onClick={() => handleRemove(item.id)}
 disabled={isPending}
 aria-label={`Remove ${item.name}`}
 className="text-xs text-[var(--text-muted)] hover:text-red-500"
 >
 Remove
 </button>
 </div>
 </li>
 ))}
 </ul>
 )}
 </div>

 <MealMatchSuggestions
 title="Cook from my pantry"
 sourceLabel="Matches your saved recipes by ingredient overlap"
 emptyHint="Add pantry items, then suggest meals you can make with what you have."
 onSuggest={async () => {
 const result = await suggestMealsFromPantry();
 if ("error" in result) return { error: result.error };
 return { data: result.data };
 }}
 />
 </div>
 );
}
