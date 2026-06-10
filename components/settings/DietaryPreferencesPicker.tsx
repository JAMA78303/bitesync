"use client";

import { useState, useTransition } from "react";
import {
 DIETARY_PREFERENCE_OPTIONS,
 toggleDietarySelection,
} from "@/lib/dietary/constants";
import { saveDietaryPreferenceKeys } from "@/lib/supabase/profile";

type Props = {
 initialSelected: string[];
 completeOnboarding?: boolean;
 onSaved?: () => void;
 submitLabel?: string;
};

export function DietaryPreferencesPicker({
 initialSelected,
 completeOnboarding = false,
 onSaved,
 submitLabel,
}: Props) {
 const [selected, setSelected] = useState<string[]>(initialSelected);
 const [message, setMessage] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [isPending, startTransition] = useTransition();

 const buttonLabel =
 submitLabel ??
 (completeOnboarding
 ? isPending
 ?"Saving..."
 :"Continue"
 : isPending
 ?"Saving…"
 :"Save preferences");

 function handleSave() {
 setMessage(null);
 setError(null);
 startTransition(async () => {
 const result = await saveDietaryPreferenceKeys(selected, {
 completeOnboarding,
 });
 if ("error" in result && result.error) {
 setError(result.error);
 return;
 }
 setMessage("Preferences saved.");
 onSaved?.();
 });
 }

 return (
 <div>
 <div className="space-y-3">
 {DIETARY_PREFERENCE_OPTIONS.map((pref) => {
 const isSelected = selected.includes(pref.key);
 return (
 <button
 key={pref.key}
 type="button"
 onClick={() => setSelected((prev) => toggleDietarySelection(prev, pref.key))}
 className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${
 isSelected
 ?"border-[var(--brand-primary)] bg-[var(--surface-brand-subtle)] border-[var(--brand-primary)]"
 :"border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border-default)]"
 }`}
 >
 <span className="w-7 text-center text-xl">{pref.icon}</span>
 <span
 className={`flex-1 text-sm font-medium ${
 isSelected ?"text-[var(--brand-primary)]" :"text-[var(--text-secondary)]"
 }`}
 >
 {pref.label}
 </span>
 <div
 className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
 isSelected
 ?"border-[var(--brand-primary)] bg-[var(--brand-primary)] border-[var(--brand-primary)]"
 :"border-[var(--border-default)]"
 }`}
 >
 {isSelected ? (
 <svg className="h-3 w-3 text-[var(--text-on-brand)]" fill="none" viewBox="0 0 12 12" aria-hidden>
 <path
 d="M10 3L5 8.5 2 5.5"
 stroke="currentColor"
 strokeWidth="1.5"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 </svg>
 ) : null}
 </div>
 </button>
 );
 })}
 </div>

 {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
 {message && !completeOnboarding ? (
 <p className="mt-3 text-sm text-green-700 dark:text-green-400">{message}</p>
 ) : null}

 <button
 type="button"
 onClick={handleSave}
 disabled={isPending || (completeOnboarding && selected.length === 0)}
 className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--brand-primary)] px-6 text-sm font-medium text-[var(--btn-primary-text)] transition-opacity hover:bg-[var(--btn-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[var(--brand-primary)]"
 >
 {buttonLabel}
 {completeOnboarding ? (
 <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
 <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
 </svg>
 ) : null}
 </button>
 </div>
 );
}
