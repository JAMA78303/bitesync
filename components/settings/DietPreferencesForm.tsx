"use client";

import { useState, useTransition } from "react";
import { saveDietaryPreferences } from "@/lib/supabase/profile-actions";
import { ds } from "@/lib/ui/classes";

type DietPrefs = {
 followsVegetarian: boolean;
 followsVegan: boolean;
 followsGlutenFree: boolean;
};

type Props = {
 initialValues: DietPrefs;
};

export function DietPreferencesForm({ initialValues }: Props) {
 const [vegetarian, setVegetarian] = useState(initialValues.followsVegetarian);
 const [vegan, setVegan] = useState(initialValues.followsVegan);
 const [glutenFree, setGlutenFree] = useState(initialValues.followsGlutenFree);
 const [message, setMessage] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [isPending, startTransition] = useTransition();

 function onSubmit(event: React.FormEvent) {
 event.preventDefault();
 setMessage(null);
 setError(null);
 startTransition(async () => {
 const result = await saveDietaryPreferences({
 followsVegetarian: vegetarian,
 followsVegan: vegan,
 followsGlutenFree: glutenFree,
 });
 if ("error" in result && result.error) {
 setError(result.error);
 return;
 }
 setMessage("Preferences saved.");
 });
 }

 return (
 <form onSubmit={onSubmit} className="space-y-4">
 <p className="text-xs text-[var(--text-muted)]">
 When enabled, the planner highlights recipes that aren&apos;t tagged as matching your diet so you can spot them when meal planning.
 </p>
 <label className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 ${ds.formSection}`}>
 <input
 type="checkbox"
 checked={vegetarian}
 onChange={(e) => setVegetarian(e.target.checked)}
 className="mt-1 h-4 w-4 rounded border-[var(--border-default)]"
 />
 <span>
 <span className="text-sm font-medium text-[var(--text-secondary)]">Vegetarian</span>
 <span className="mt-0.5 block text-xs text-[var(--text-muted)]">No meat or fish</span>
 </span>
 </label>
 <label className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 ${ds.formSection}`}>
 <input
 type="checkbox"
 checked={vegan}
 onChange={(e) => {
 const next = e.target.checked;
 setVegan(next);
 if (next) setVegetarian(true);
 }}
 className="mt-1 h-4 w-4 rounded border-[var(--border-default)]"
 />
 <span>
 <span className="text-sm font-medium text-[var(--text-secondary)]">Vegan</span>
 <span className="mt-0.5 block text-xs text-[var(--text-muted)]">No animal products</span>
 </span>
 </label>
 <label className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 ${ds.formSection}`}>
 <input
 type="checkbox"
 checked={glutenFree}
 onChange={(e) => setGlutenFree(e.target.checked)}
 className="mt-1 h-4 w-4 rounded border-[var(--border-default)]"
 />
 <span>
 <span className="text-sm font-medium text-[var(--text-secondary)]">Gluten-free</span>
 <span className="mt-0.5 block text-xs text-[var(--text-muted)]">Avoid wheat, barley, rye</span>
 </span>
 </label>
 {error ? <p className="text-sm text-[var(--semantic-error-text)]">{error}</p> : null}
 {message ? <p className="text-sm text-[var(--semantic-success-text)]">{message}</p> : null}
 <button
 type="submit"
 disabled={isPending}
 className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-text)] transition-colors hover:bg-[var(--btn-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
 >
 {isPending ?"Saving…" :"Save diet preferences"}
 </button>
 </form>
 );
}
