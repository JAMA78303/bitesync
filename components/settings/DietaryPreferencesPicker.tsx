"use client";

import { useState, useTransition } from "react";
import {
 DIETARY_PREFERENCE_OPTIONS,
 toggleDietarySelection,
} from "@/lib/dietary/constants";
import { saveDietaryPreferenceKeys } from "@/lib/supabase/profile-actions";
import { Beef, Fish, Leaf, MilkOff, MoonStar, Sprout, Utensils, WheatOff, type LucideIcon } from "lucide-react";

/** Line icons in place of the emoji in DIETARY_PREFERENCE_OPTIONS. */
const DIET_ICONS: Record<string, LucideIcon> = {
 no_preference: Utensils,
 vegetarian: Leaf,
 vegan: Sprout,
 pescatarian: Fish,
 meat_eater: Beef,
 gluten_free: WheatOff,
 dairy_free: MilkOff,
 halal: MoonStar,
};

/**
 * Chip labels for the compact picker. "No specific preferences" and "I eat
 * meat" are left out there: choosing nothing already means no restrictions.
 */
const COMPACT_LABELS: Record<string, string> = {
 vegetarian: "Vegetarian",
 vegan: "Vegan",
 pescatarian: "Pescatarian",
 gluten_free: "Gluten free",
 dairy_free: "Dairy free",
 halal: "Halal",
};

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
 /** Small chips for real restrictions only (onboarding step 1). Implies autoSave. */
 compact?: boolean;
};

export function DietaryPreferencesPicker({
 initialSelected,
 completeOnboarding = false,
 onSaved,
 submitLabel,
 autoSave = false,
 compact = false,
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
 if (autoSave || compact) persist(next, false);
 }

 if (compact) {
 return (
 <div>
 <div role="group" aria-label="Dietary needs" className="flex flex-wrap gap-2">
 {DIETARY_PREFERENCE_OPTIONS.filter((pref) => pref.key in COMPACT_LABELS).map((pref) => {
 const isSelected = selected.includes(pref.key);
 const Icon = DIET_ICONS[pref.key] ?? Utensils;
 return (
 <button
 key={pref.key}
 type="button"
 aria-pressed={isSelected}
 onClick={() => handleToggle(pref.key)}
 className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors ${
 isSelected
 ? "border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
 : "border-[var(--border-default)] bg-[var(--surface-input)] text-[var(--text-secondary)] hover:border-[var(--brand-action)]"
 }`}
 >
 <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden />
 {COMPACT_LABELS[pref.key]}
 </button>
 );
 })}
 </div>
 {error ? <p className="mt-2 text-sm text-[var(--semantic-error-text)]">{error}</p> : null}
 </div>
 );
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
 <span
 className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
 isSelected ?"bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]" :"bg-[var(--surface-brand-subtle)] text-[var(--brand-primary)]"
 }`}
 aria-hidden
 >
 {(() => {
 const Icon = DIET_ICONS[pref.key] ?? Utensils;
 return <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />;
 })()}
 </span>
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
 ?"border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)]"
 :"border-[var(--border-default)]"
 }`}
 >
 {isSelected ? (
 <svg className="h-3 w-3 text-[var(--btn-primary-text)]" fill="none" viewBox="0 0 12 12" aria-hidden>
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
 className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--btn-primary-bg)] px-6 text-sm font-medium text-[var(--btn-primary-text)] transition-opacity hover:bg-[var(--btn-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[var(--brand-primary)]"
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
