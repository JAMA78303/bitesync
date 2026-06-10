"use client";

import { useState, useTransition } from "react";
import { addCofidOverride, removeCofidOverride } from "@/app/admin/nutrition/actions";

export type CofidOverrideRow = {
 id: number;
 ingredient_name: string;
 food_code: string;
 note: string | null;
 cofid_food_name: string | null;
};

type Props = {
 overrides: CofidOverrideRow[];
};

export function CoFIDOverridesEditor({ overrides }: Props) {
 const [isPending, startTransition] = useTransition();
 const [ingredientName, setIngredientName] = useState("");
 const [foodCode, setFoodCode] = useState("");
 const [note, setNote] = useState("");
 const [message, setMessage] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);

 function onAdd(e: React.FormEvent) {
 e.preventDefault();
 setMessage(null);
 setError(null);
 startTransition(async () => {
 const result = await addCofidOverride({
 ingredient_name: ingredientName,
 food_code: foodCode,
 note: note || undefined,
 });
 if (result.error) {
 setError(result.error);
 return;
 }
 setIngredientName("");
 setFoodCode("");
 setNote("");
 setMessage("Override saved.");
 });
 }

 function onRemove(id: number) {
 setMessage(null);
 setError(null);
 startTransition(async () => {
 const result = await removeCofidOverride(id);
 if (result.error) setError(result.error);
 else setMessage("Override removed.");
 });
 }

 return (
 <div>
 {message ? (
 <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
 {message}
 </p>
 ) : null}
 {error ? (
 <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
 {error}
 </p>
 ) : null}

 <form onSubmit={onAdd} className="mb-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
 <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Add override</h2>
 <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
 <input
 placeholder="Ingredient name (e.g. plain flour)"
 value={ingredientName}
 onChange={(e) => setIngredientName(e.target.value)}
 className="min-w-[200px] flex-1 rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm"
 required
 />
 <input
 placeholder="CoFID food_code (e.g. 11-886)"
 value={foodCode}
 onChange={(e) => setFoodCode(e.target.value)}
 className="w-full rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm sm:w-40"
 required
 />
 <input
 placeholder="Note (optional)"
 value={note}
 onChange={(e) => setNote(e.target.value)}
 className="min-w-[160px] flex-1 rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm"
 />
 <button
 type="submit"
 disabled={isPending}
 className="rounded-xl bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-60"
 >
 {isPending ?"Saving…" :"Add"}
 </button>
 </div>
 <p className="mt-2 text-xs text-[var(--text-muted)]">
 Names are stored lowercase. Overrides are checked before fuzzy CoFID matching.
 </p>
 </form>

 <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)]">
 <table className="w-full text-sm">
 <thead className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-muted)]">
 Ingredient
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-muted)]">
 Food code
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-muted)]">
 Maps to
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-muted)]">
 Note
 </th>
 <th className="px-4 py-3" />
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {overrides.length === 0 ? (
 <tr>
 <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
 No overrides yet.
 </td>
 </tr>
 ) : (
 overrides.map((o) => (
 <tr key={o.id}>
 <td className="px-4 py-3 font-mono text-xs">{o.ingredient_name}</td>
 <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{o.food_code}</td>
 <td className="max-w-xs truncate px-4 py-3 text-xs text-[var(--text-secondary)]">
 {o.cofid_food_name ??"—"}
 </td>
 <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{o.note ??""}</td>
 <td className="px-4 py-3 text-right">
 <button
 type="button"
 disabled={isPending}
 onClick={() => onRemove(o.id)}
 className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
 >
 Remove
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
}
