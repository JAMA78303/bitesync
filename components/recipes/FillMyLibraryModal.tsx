"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
 generateFillLibrarySlot,
 planFillMyLibrary,
 saveFillLibraryRecipes,
} from "@/app/(app)/recipes/bulkFillActions";
import { ds } from "@/lib/ui/classes";
import { ModalPortal } from "@/components/ui/ModalPortal";
import type { HybridRecipeDraft } from "@/lib/recipes/hybridRecipeEngine";

type DraftRow = HybridRecipeDraft & {
 slotId: string;
 selected: boolean;
 status:"pending" |"generating" |"ready" |"failed";
 error?: string;
};

type Props = {
 onClose: () => void;
};

export function FillMyLibraryModal({ onClose }: Props) {
 const router = useRouter();
 const [isPending, startTransition] = useTransition();
 const [phase, setPhase] = useState<"setup" |"generating" |"review" |"done">("setup");
 const [count, setCount] = useState(10);
 const [rows, setRows] = useState<DraftRow[]>([]);
 const [progress, setProgress] = useState("");
 const [globalError, setGlobalError] = useState<string | null>(null);
 const [saveSummary, setSaveSummary] = useState<string | null>(null);

 const readyRows = rows.filter((r) => r.status ==="ready");
 const selectedCount = rows.filter((r) => r.selected && r.status ==="ready").length;

 const runGeneration = useCallback(async () => {
 setGlobalError(null);
 setSaveSummary(null);
 setPhase("generating");

 const plan = await planFillMyLibrary(count);
 if ("error" in plan) {
 setGlobalError(plan.error);
 setPhase("setup");
 return;
 }
 if (!plan.data) {
 setGlobalError("Could not plan batch.");
 setPhase("setup");
 return;
 }

 const initial: DraftRow[] = plan.data.slots.map((slot) => ({
 slotId: slot.slotId,
 selected: true,
 status:"pending",
 name:"",
 description:"",
 steps: [],
 ingredients: [],
 mealSlot: slot.mealSlot,
 targetMealCalories: 0,
 achievedCalories: 0,
 achievedProteinG: 0,
 fitsVegetarian: false,
 fitsVegan: false,
 fitsGlutenFree: false,
 source:"db",
 slotLabel: slot.label,
 }));
 setRows(initial);

 const accepted: HybridRecipeDraft[] = [];
 const slots = plan.data.slots;

 for (let i = 0; i < slots.length; i++) {
 const slot = slots[i];
 setProgress(`Generating ${i + 1} of ${slots.length}: ${slot.label}…`);
 setRows((prev) =>
 prev.map((r) => (r.slotId === slot.slotId ? { ...r, status:"generating" } : r)),
 );

 const result = await generateFillLibrarySlot({
 slot,
 hardConstraints: plan.data.hardConstraints,
 dailyCalorieTarget: plan.data.dailyCalorieTarget,
 dailyProteinTarget: plan.data.dailyProteinTarget,
 acceptedDrafts: accepted,
 });

 if ("error" in result) {
 setRows((prev) =>
 prev.map((r) =>
 r.slotId === slot.slotId
 ? { ...r, status:"failed", error: result.error, selected: false }
 : r,
 ),
 );
 continue;
 }
 if (!result.data) {
 continue;
 }

 accepted.push(result.data);
 const draft = result.data;
 setRows((prev) =>
 prev.map((r) =>
 r.slotId === slot.slotId
 ? {
 ...draft,
 slotId: slot.slotId,
 selected: true,
 status:"ready" as const,
 }
 : r,
 ),
 );
 }

 setProgress("");
 setPhase("review");
 }, [count]);

 function toggleSelected(slotId: string) {
 setRows((prev) =>
 prev.map((r) => (r.slotId === slotId && r.status ==="ready" ? { ...r, selected: !r.selected } : r)),
 );
 }

 function onSave() {
 const toSave = rows.filter((r) => r.selected && r.status ==="ready");
 if (!toSave.length) {
 setGlobalError("Select at least one recipe to save.");
 return;
 }

 setGlobalError(null);
 startTransition(async () => {
 const result = await saveFillLibraryRecipes(
 toSave.map((r) => ({
 name: r.name,
 description: r.description,
 ingredients: r.ingredients,
 steps: r.steps,
 fitsVegetarian: r.fitsVegetarian,
 fitsVegan: r.fitsVegan,
 fitsGlutenFree: r.fitsGlutenFree,
 })),
 );

 if ("error" in result) {
 setGlobalError(result.error);
 return;
 }

 const saved = result.data?.saved.length ?? 0;
 const failed = result.data?.failed ?? [];
 const parts = [`Saved ${saved} recipe${saved === 1 ?"" :"s"}.`];
 if (failed.length) {
 parts.push(`${failed.length} could not be saved.`);
 }
 setSaveSummary(parts.join(""));
 setPhase("done");
 router.refresh();
 });
 }

 return (
 <ModalPortal>
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
 <div
 className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[var(--surface-card)] shadow-xl"
 role="dialog"
 aria-labelledby="fill-library-title"
 >
 <div className="border-b border-[var(--border-subtle)] px-5 py-4">
 <h2 id="fill-library-title" className="text-lg font-semibold text-[var(--text-primary)]">
 Fill my library
 </h2>
 <p className="mt-1 text-sm text-[var(--text-muted)]">
 Generate varied breakfasts, lunches, dinners, and snacks sized to your daily target. Review before saving — if a slot fails, you can run fill again or add that meal type manually.
 </p>
 </div>

 <div className="flex-1 overflow-y-auto px-5 py-4">
 {phase ==="setup" ? (
 <div className="space-y-4">
 <label className="block text-sm font-medium text-[var(--text-secondary)]">
 How many recipes?
 <select
 value={count}
 onChange={(e) => setCount(Number(e.target.value))}
 className="mt-1 block w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm"
 >
 {[8, 10, 12, 14, 16].map((n) => (
 <option key={n} value={n}>
 {n} recipes (mixed meals)
 </option>
 ))}
 </select>
 </label>
 <p className="text-xs text-[var(--text-muted)]">
 Your dietary settings are hard limits. Each batch rotates meal types and templates so you
 get different dishes — run fill again for another mix. Omnivores get meat, fish, and plant-based mains.
 </p>
 </div>
 ) : null}

 {phase ==="generating" && progress ? (
 <p className="text-sm text-[var(--brand-primary)]">{progress}</p>
 ) : null}

 {(phase ==="review" || phase ==="done") && rows.length > 0 ? (
 <ul className="space-y-3">
 {rows.map((row) => (
 <li
 key={row.slotId}
 className={`rounded-xl border p-3 ${
 row.status ==="failed"
 ?"border-[var(--semantic-error-border)] bg-[var(--semantic-error-bg)]/50"
 :"border-[var(--border-default)]"
 }`}
 >
 {row.status ==="ready" ? (
 <label className="flex cursor-pointer gap-3">
 <input
 type="checkbox"
 checked={row.selected}
 onChange={() => toggleSelected(row.slotId)}
 className="mt-1 h-4 w-4 rounded border-[var(--border-default)]"
 />
 <div className="min-w-0 flex-1">
 <p className="font-medium text-[var(--text-primary)]">{row.name}</p>
 <p className="text-xs text-[var(--text-muted)]">{row.slotLabel}</p>
 <p className="mt-1 text-xs text-[var(--text-muted)]">
 ~{Math.round(row.achievedCalories)} kcal · {row.achievedProteinG}g protein
 {row.targetMiss ?" · below target" :""}
 {row.varietyRelaxed ?" · variety relaxed" :""}
 {row.fitsVegan ?" · Vegan" : row.fitsVegetarian ?" · Vegetarian" :""}
 {row.fitsGlutenFree ?" · GF" :""}
 </p>
 <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
 {row.ingredients.map((i: { name: string }) => i.name).slice(0, 5).join(",")}
 {row.ingredients.length > 5 ?"…" :""}
 </p>
 </div>
 </label>
 ) : row.status ==="failed" ? (
 <div>
 <p className="text-sm font-medium text-[var(--semantic-error-text)]">{row.slotLabel}</p>
 <p className="text-xs text-[var(--semantic-error-text)]/80">{row.error ??"Skipped"}</p>
 </div>
 ) : (
 <p className="text-sm text-[var(--text-muted)]">{row.slotLabel} — {row.status}…</p>
 )}
 </li>
 ))}
 </ul>
 ) : null}

 {globalError ? (
 <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${ds.errorCallout}`}>
 {globalError}
 </p>
 ) : null}

 {saveSummary ? (
 <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${ds.successCallout}`}>
 {saveSummary}
 </p>
 ) : null}

 {phase ==="review" && readyRows.length === 0 ? (
 <p className="text-sm text-[var(--semantic-warn-text)]">No recipes generated — try again or adjust your settings.</p>
 ) : null}
 </div>

 <div className="flex gap-2 border-t border-[var(--border-subtle)] px-5 py-4">
 <button
 type="button"
 onClick={onClose}
 className="flex-1 rounded-lg border border-[var(--border-default)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
 >
 {phase ==="done" ?"Close" :"Cancel"}
 </button>
 {phase ==="setup" ? (
 <button
 type="button"
 onClick={() => void runGeneration()}
 className={`flex-1 ${ds.primaryBtn}`}
 >
 Generate batch
 </button>
 ) : null}
 {phase ==="review" ? (
 <button
 type="button"
 disabled={isPending || selectedCount === 0}
 onClick={onSave}
 className={`flex-1 ${ds.primaryBtn} disabled:opacity-50`}
 >
 {isPending ?"Saving…" : `Save ${selectedCount} selected`}
 </button>
 ) : null}
 </div>
 </div>
 </div>
 </ModalPortal>
 );
}
