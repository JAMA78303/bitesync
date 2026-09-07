"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
 generateFillLibrarySlot,
 planFillMyLibrary,
 saveFillLibraryRecipes,
} from "@/app/(app)/recipes/bulkFillActions";
import {
 bulkFillBatchSummary,
 defaultBulkRecipeCount,
 isDuplicateDraft,
 type ExistingLibrarySnapshot,
} from "@/lib/recipes/bulkFillLibrary";
import { FIRST_RUN_LIBRARY_COUNT_PRO } from "@/lib/onboarding/first-run";
import { ds } from "@/lib/ui/classes";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { releaseScreenWakeLock, requestScreenWakeLock, waitUntilVisible } from "@/lib/ui/keepAwake";
import type { HybridRecipeDraft } from "@/lib/recipes/hybridRecipeEngine";

/**
 * Overlapping slot generations. 4 was a first guess that left a 32-recipe batch
 * at ~4 minutes; 8 halves that and still sits far below the request rate a
 * standard Anthropic tier allows, given each slot occupies its worker for tens
 * of seconds. The SDK client retries 429s (see lib/ai/anthropicClient.ts), so
 * brief limit pressure costs a retry rather than a template-quality recipe.
 */
const FILL_CONCURRENCY = 8;

/** Intra-batch collisions only — the server already checked the saved library. */
const EMPTY_LIBRARY: ExistingLibrarySnapshot = { names: [], signatures: [] };

type DraftRow = HybridRecipeDraft & {
 slotId: string;
 selected: boolean;
 status:"pending" |"generating" |"ready" |"failed";
 error?: string;
};

type Props = {
 onClose: () => void;
 /** Inline panel for onboarding — no modal overlay. */
 embedded?: boolean;
 /** Smaller batch + simplified UI for first-run step 2. */
 firstRun?: boolean;
 /** First-run batch size — tier-aware, pass firstRunLibraryCount(isPro). */
 firstRunCount?: number;
 onComplete?: () => void;
};

export function FillMyLibraryModal({ onClose, embedded = false, firstRun = false, firstRunCount, onComplete }: Props) {
 const router = useRouter();
 const [isPending, startTransition] = useTransition();
 const [phase, setPhase] = useState<"setup" |"generating" |"review" |"done">("setup");
 const [count, setCount] = useState(
 firstRun ? (firstRunCount ?? FIRST_RUN_LIBRARY_COUNT_PRO) : defaultBulkRecipeCount(),
 );
 const [rows, setRows] = useState<DraftRow[]>([]);
 const [progress, setProgress] = useState("");
 const [globalError, setGlobalError] = useState<string | null>(null);
 const [saveSummary, setSaveSummary] = useState<string | null>(null);

 const readyRows = rows.filter((r) => r.status ==="ready");
 const readyByType = readyRows.reduce(
 (acc, row) => {
 const key = row.mealSlot ?? "other";
 acc[key] = (acc[key] ?? 0) + 1;
 return acc;
 },
 {} as Record<string, number>,
 );
 const selectedCount = rows.filter((r) => r.selected && r.status ==="ready").length;
 const failedCount = rows.filter((r) => r.status ==="failed").length;
 const allReadySelected = readyRows.length > 0 && selectedCount === readyRows.length;

 function toggleSelectAll() {
 const next = !allReadySelected;
 setRows((prev) => prev.map((r) => (r.status ==="ready" ? { ...r, selected: next } : r)));
 }

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
 // Unselected by default: saving 40 recipes should be a deliberate choice,
 // not the consequence of not unticking them.
 selected: false,
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

 const planData = plan.data;
 const slots = planData.slots;
 const accepted: { slotId: string; draft: HybridRecipeDraft }[] = [];
 let completed = 0;

 const markGenerating = (slotId: string) =>
 setRows((prev) => prev.map((r) => (r.slotId === slotId ? { ...r, status:"generating" } : r)));

 const markFailed = (slotId: string, error: string) =>
 setRows((prev) =>
 prev.map((r) => (r.slotId === slotId ? { ...r, status:"failed", error, selected: false } : r)),
 );

 const markReady = (slotId: string, draft: HybridRecipeDraft) =>
 setRows((prev) =>
 prev.map((r) =>
 r.slotId === slotId ? { ...draft, slotId, selected: false, status:"ready" as const } : r,
 ),
 );

 // Returns the outcome rather than writing it, so the caller decides: the
 // retry pass below has to leave the original draft in place when a
 // replacement doesn't materialise, which a self-marking helper can't express.
 const runSlot = async (
 slot: (typeof slots)[number],
 priorDrafts: HybridRecipeDraft[],
 ): Promise<{ draft: HybridRecipeDraft } | { error: string }> => {
 // If the tab was suspended, wait until it is visible again before
 // continuing rather than failing the remaining slots.
 await waitUntilVisible();
 markGenerating(slot.slotId);
 const result = await generateFillLibrarySlot({
 slot,
 hardConstraints: planData.hardConstraints,
 dailyCalorieTarget: planData.dailyCalorieTarget,
 dailyProteinTarget: planData.dailyProteinTarget,
 acceptedDrafts: priorDrafts,
 });
 if ("error" in result) return { error: result.error };
 // A slot that returns no draft used to `continue`, leaving its row spinning
 // on "generating" for the rest of the session with nothing to explain it.
 if (!result.data) return { error:"No recipe fitted this slot's calorie and diet limits." };
 return { draft: result.data };
 };

 // Generation is a client-side loop, so a locked phone or a backgrounded tab
 // suspends it mid-batch and nothing resumes it. Hold a screen wake lock for
 // the duration where the browser supports it.
 const wakeLock = await requestScreenWakeLock();

 try {
 // Slots used to run strictly one after another. That was invisible while
 // every call fell back to a local template, but with Claude actually
 // answering a slot costs ~40s and a 40-recipe batch took ~26 minutes.
 // Run a rolling window instead: each finished draft joins `accepted`
 // immediately, so only the few in flight at any moment are blind to each
 // other, and the reconciliation pass below repairs the collisions that
 // blindness allows. Kept deliberately low — the point is to overlap
 // latency, not to fan out hard enough to hit Anthropic's rate limit.
 let cursor = 0;
 const worker = async () => {
 while (cursor < slots.length) {
 const slot = slots[cursor++];
 const outcome = await runSlot(
 slot,
 accepted.map((a) => a.draft),
 );
 completed += 1;
 setProgress(`Generated ${completed} of ${slots.length}…`);
 if ("error" in outcome) {
 markFailed(slot.slotId, outcome.error);
 continue;
 }
 accepted.push({ slotId: slot.slotId, draft: outcome.draft });
 markReady(slot.slotId, outcome.draft);
 }
 };

 await Promise.all(
 Array.from({ length: Math.min(FILL_CONCURRENCY, slots.length) }, () => worker()),
 );

 // Concurrent slots can't see each other's results, so two of them can land
 // on the same dish. The server already checks each draft against the saved
 // library; this covers the gap it cannot see. Duplicates are re-run one at
 // a time with the whole batch as context.
 const kept: HybridRecipeDraft[] = [];
 const collisions: { slotId: string; draft: HybridRecipeDraft }[] = [];
 for (const entry of accepted) {
 const check = { name: entry.draft.name, ingredients: entry.draft.ingredients };
 if (isDuplicateDraft(check, EMPTY_LIBRARY, kept)) collisions.push(entry);
 else kept.push(entry.draft);
 }

 for (let i = 0; i < collisions.length; i++) {
 const slot = slots.find((s) => s.slotId === collisions[i].slotId);
 if (!slot) continue;
 setProgress(`Replacing duplicate ${i + 1} of ${collisions.length}…`);
 const outcome = await runSlot(slot, kept);
 // No replacement found: keep the duplicate rather than dropping the row.
 // It is reviewable and untickable; an empty slot is neither.
 if ("error" in outcome) {
 markReady(slot.slotId, collisions[i].draft);
 continue;
 }
 kept.push(outcome.draft);
 markReady(slot.slotId, outcome.draft);
 }
 } finally {
 await releaseScreenWakeLock(wakeLock);
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
 onComplete?.();
 });
 }

 const panel = (
 <div
 className={
 embedded
 ? "flex flex-col"
 : "flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[var(--surface-card)] shadow-xl"
 }
 role={embedded ? undefined : "dialog"}
 aria-labelledby="fill-library-title"
 >
 <div className={embedded ? "mb-3" : "border-b border-[var(--border-subtle)] px-5 py-4"}>
 <h2 id="fill-library-title" className="text-lg font-semibold text-[var(--text-primary)]">
 Fill my library
 </h2>
 <p className="mt-1 text-sm text-[var(--text-muted)]">
 {firstRun
 ? "We’ll generate a starter set sized to your diet and targets — review, then save."
 : "Generate varied breakfasts, lunches, dinners, and snacks sized to your daily target. Review before saving — if a slot fails, you can run fill again or add that meal type manually."}
 </p>
 </div>

 <div className={embedded ? "" : "flex-1 overflow-y-auto px-5 py-4"}>
 {phase ==="setup" ? (
 <div className="space-y-4">
 {firstRun ? (
 <p className="text-sm text-[var(--text-secondary)]">
 {count} recipes ({bulkFillBatchSummary(count)}) — enough to plan a varied week.
 </p>
 ) : (
 <>
 <label className="block text-sm font-medium text-[var(--text-secondary)]">
 How many recipes?
 <select
 value={count}
 onChange={(e) => setCount(Number(e.target.value))}
 className="mt-1 block w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm"
 >
 {[20, 28, 32, 36, 40].map((n) => (
 <option key={n} value={n}>
 {n} recipes ({bulkFillBatchSummary(n)})
 </option>
 ))}
 </select>
 </label>
 <p className="text-xs text-[var(--text-muted)]">
 Your dietary settings are hard limits. Each batch builds equal depth per meal type so a
 generated week can rotate without repeats — run fill again for another mix. Omnivores get
 meat, fish, and plant-based mains.
 </p>
 </>
 )}
 </div>
 ) : null}

 {phase ==="generating" && progress ? (
 <p className="text-sm text-[var(--brand-primary)]">{progress}</p>
 ) : null}

 {(phase ==="review" || phase ==="done") && rows.length > 0 ? (
 <>
 {readyRows.length > 0 ? (
 <div className="mb-3 space-y-2">
 <p className="text-xs text-[var(--text-muted)]">
 Ready:{" "}
 {["breakfast", "lunch", "dinner", "snack"]
 .map((t) => `${readyByType[t] ?? 0} ${t}`)
 .join(" · ")}
 {/* Say plainly when a slot failed — "39 selected" out of a 40 batch
 previously looked like an off-by-one rather than one bad slot. */}
 {failedCount > 0
 ? ` — ${readyRows.length} of ${rows.length} generated, ${failedCount} failed`
 : ""}
 </p>
 {phase === "review" ? (
 <div className="flex items-center justify-between gap-2">
 <span className="text-xs text-[var(--text-muted)]">
 {selectedCount} of {readyRows.length} selected
 </span>
 <button
 type="button"
 onClick={toggleSelectAll}
 className="cursor-pointer rounded-lg border border-[var(--border-default)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)]"
 >
 {allReadySelected ? "Clear selection" : "Select all"}
 </button>
 </div>
 ) : null}
 </div>
 ) : null}
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
 </>
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

 <div className={`flex gap-2 ${embedded ? "mt-4" : "border-t border-[var(--border-subtle)] px-5 py-4"}`}>
 {!embedded ? (
 <button
 type="button"
 onClick={onClose}
 className="flex-1 rounded-lg border border-[var(--border-default)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
 >
 {phase ==="done" ?"Close" :"Cancel"}
 </button>
 ) : null}
 {phase ==="setup" ? (
 <button
 type="button"
 onClick={() => void runGeneration()}
 className={`flex-1 ${ds.primaryBtn}`}
 >
 {firstRun ? "Fill my library" : "Generate batch"}
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
 {phase ==="done" && embedded && onComplete ? (
 <button type="button" onClick={onComplete} className={`flex-1 ${ds.primaryBtn}`}>
 Continue
 </button>
 ) : null}
 </div>
 </div>
 );

 if (embedded) return panel;

 return (
 <ModalPortal>
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
 {panel}
 </div>
 </ModalPortal>
 );
}
