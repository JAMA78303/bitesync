"use client";

import { useState, useTransition } from "react";
import {
 DIETARY_PREFERENCE_OPTIONS,
 toggleDietarySelection,
} from "@/lib/dietary/constants";
import { saveDietaryPreferenceKeys } from "@/lib/supabase/profile-actions";

type Props = {
 initialSelected: string[];
 completeOnboarding?: boolean;
 onSaved?: () => void;
 submitLabel?: string;
 /**
 * Persist on every tap and render no button. For screens that already have
 * one call to action: onboarding step 1 used to show this picker's "Save
 * preferences" above the targets form's own submit, and only the second one
 * advanced. Tapping the first showed "Preferences saved." and went nowhere;
 * skipping it and continuing silently discarded the selection.
 */
 autoSave?: boolean;
};

export function DietaryPreferencesPicker({
 initialSelected,
 completeOnboarding = false,
 onSaved,
 submitLabel,
 autoSave = false,
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

 function persist(keys: string[], announce: boolean) {
 setMessage(null);
 setError(null);
 startTransition(async () => {
 const result = await saveDietaryPreferenceKeys(keys, {
 completeOnboarding,
 });
 if ("error" in result && result.error) {
 setError(result.error);
 return;
 }
 // Auto-save would flash "Preferences saved." on every tap; the selected
 // state of the chip is the confirmation there.
 if (announce) setMessage("Preferences saved.");
 onSaved?.();
 });
 }

 function handleSave() {
 persist(selected, true);
 }

 function handleToggle(key: string) {
 const next = toggleDietarySelection(selected, key);
 setSelected(next);
 if (autoSave) persist(next, false);
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
 onClick={() => handleToggle(pref.key)}
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

 {error ? <p className="mt-3 text-sm text-[var(--semantic-error-text)]">{error}</p> : null}
 {message && !completeOnboarding ? (
 <p className="mt-3 text-sm text-[var(--semantic-success-text)]">{message}</p>
 ) : null}

 {autoSave ? null : (
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
 )}
 </div>
 );
}
