"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Link as LinkIcon, Loader2, Plus, Trash2, X } from "lucide-react";
import type { RecipeSourceType } from "@/lib/recipes/detectSourceType";
import type { ParsedIngredient } from "@/lib/recipes/parseIngredient";

export type { ParsedIngredient };

export type ImportResult = {
 name: string;
 ingredients: ParsedIngredient[];
 steps: string[];
 sourceUrl: string;
 sourceDomain: string;
 sourceType: RecipeSourceType;
 /** Servings/yield from page metadata when available. */
 detectedServings: number;
 /** How many people to scale quantities for (set on servings step). */
 cookingFor: number;
 importNotice?: string;
};

type Step ="url" |"preview" |"servings";

type Props = {
 onClose: () => void;
 onImport: (result: ImportResult) => Promise<void> | void;
};

const EMPTY_INGREDIENT = (): ParsedIngredient => ({
 quantity: null,
 unit: null,
 name:"",
 grams: null,
 gramsSource: null,
 rawText:"",
});

export function ImportRecipeModal({ onClose, onImport }: Props) {
 const [step, setStep] = useState<Step>("url");
 const [url, setUrl] = useState("");
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");
 const [result, setResult] = useState<Omit<ImportResult,"cookingFor"> | null>(null);
 const [cookingFor, setCookingFor] = useState(1);

 const canImport = useMemo(() => url.trim().length > 0 && !loading, [url, loading]);

 async function handleFetch() {
 if (!url.trim()) return;
 setLoading(true);
 setError("");
 try {
 const res = await fetch("/api/recipes/import", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({ url: url.trim() }),
 });
 const data = await res.json();
 if (!res.ok && !data?.sourceUrl) {
 throw new Error(data?.error ||"Import failed");
 }
 const detectedServings =
 typeof data.detectedServings ==="number" && data.detectedServings > 0
 ? data.detectedServings
 : 1;
 setResult({
 name: data.name ||"Imported recipe",
 ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
 steps: Array.isArray(data.steps) ? data.steps : [],
 sourceUrl: data.sourceUrl || url.trim(),
 sourceDomain: data.sourceDomain || new URL(url.trim()).hostname.replace(/^www\./,""),
 sourceType: data.sourceType ||"unknown",
 detectedServings,
 importNotice: data.importNotice,
 });
 setCookingFor(1);
 setStep("preview");
 } catch (err) {
 const msg = err instanceof Error ? err.message :"Could not import recipe. Try a different URL.";
 setError(msg);
 } finally {
 setLoading(false);
 }
 }

 function removeIngredient(index: number) {
 if (!result) return;
 setResult({
 ...result,
 ingredients: result.ingredients.filter((_, i) => i !== index),
 });
 }

 function addIngredient() {
 if (!result) return;
 setResult({
 ...result,
 ingredients: [...result.ingredients, EMPTY_INGREDIENT()],
 });
 }

 function updateIngredient(index: number, patch: Partial<ParsedIngredient>) {
 if (!result) return;
 setResult({
 ...result,
 ingredients: result.ingredients.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)),
 });
 }

 function updateStep(index: number, value: string) {
 if (!result) return;
 setResult({
 ...result,
 steps: result.steps.map((stepText, i) => (i === index ? value : stepText)),
 });
 }

 function addStep() {
 if (!result) return;
 setResult({ ...result, steps: [...result.steps,""] });
 }

 async function handleConfirmImport() {
 if (!result || saving || step !=="servings") return;
 setSaving(true);
 setError("");
 try {
 const payload: ImportResult = {
 ...result,
 cookingFor,
 };
 await onImport({
 ...payload,
 ingredients: payload.ingredients.filter((i) => i.name.trim().length > 0),
 steps: payload.steps.map((s) => s.trim()).filter(Boolean),
 });
 } catch (err) {
 setError(err instanceof Error ? err.message :"Failed to save imported recipe.");
 } finally {
 setSaving(false);
 }
 }

 function handleBackFromPreview() {
 setResult(null);
 setStep("url");
 }

 const detected = result?.detectedServings ?? 1;
 const hasValidIngredients = (result?.ingredients ?? []).some((i) => i.name.trim().length > 0);

 return (
 <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center">
 <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-[var(--surface-card)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-2xl sm:rounded-2xl sm:pb-6">
 <div className="mb-4 flex items-center justify-between">
 <h2 className="text-lg font-semibold">Import recipe</h2>
 <button onClick={onClose} className="rounded-lg p-1 hover:bg-[var(--btn-secondary-hover)]" aria-label="Close import modal">
 <X className="h-5 w-5" />
 </button>
 </div>

 {step ==="url" ? (
 <>
 <p className="mb-4 text-sm text-[var(--text-muted)]">
 Paste a link from a recipe site, TikTok, Instagram, or Facebook. You&apos;ll review everything before
 saving.
 </p>
 <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
 <div className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-input)] px-3 py-2">
 <LinkIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
 <input
 type="url"
 inputMode="url"
 autoComplete="url"
 value={url}
 onChange={(e) => setUrl(e.target.value)}
 onKeyDown={(e) => e.key ==="Enter" && handleFetch()}
 placeholder="https://..."
 className="min-w-0 flex-1 bg-transparent text-base outline-none sm:text-sm"
 autoFocus
 />
 </div>
 <button
 onClick={handleFetch}
 disabled={!canImport}
 className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-text)] disabled:opacity-50 sm:h-auto sm:py-2"
 >
 {loading ? <Loader2 className="h-4 w-4 animate-spin" /> :"Import"}
 </button>
 </div>
 </>
 ) : null}

 {step ==="preview" && result ? (
 <>
 {result.importNotice ? (
 <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{result.importNotice}</p>
 ) : null}

 <div className="mb-4">
 <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Recipe name</label>
 <input
 value={result.name}
 onChange={(e) => setResult({ ...result, name: e.target.value })}
 className="h-10 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm font-semibold"
 />
 <a
 href={result.sourceUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--brand-primary)]"
 >
 <ExternalLink className="h-3 w-3" />
 View original on {result.sourceDomain}
 </a>
 </div>

 <div className="mb-2 flex items-center justify-between">
 <p className="text-sm font-medium text-[var(--text-secondary)]">Ingredients ({result.ingredients.length})</p>
 <button
 type="button"
 onClick={addIngredient}
 className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-primary)] hover:underline"
 >
 <Plus className="h-3 w-3" />
 Add row
 </button>
 </div>
 <div className="mb-6 space-y-2">
 {result.ingredients.length === 0 ? (
 <p className="rounded-lg bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-muted)]">
 No ingredients found — add them manually below.
 </p>
 ) : null}
 {result.ingredients.map((ing, i) => (
 <div key={`${ing.rawText}-${i}`} className="space-y-1 rounded-lg bg-[var(--surface-muted)] p-2">
 <div className="grid gap-2 md:grid-cols-[1fr_80px_80px_72px_36px]">
 <input
 value={ing.name}
 onChange={(e) => updateIngredient(i, { name: e.target.value })}
 className="h-9 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-2 text-sm"
 placeholder="Ingredient name"
 />
 <input
 value={ing.quantity ??""}
 onChange={(e) =>
 updateIngredient(i, {
 quantity: e.target.value ? Number(e.target.value) : null,
 })
 }
 type="number"
 min="0"
 step="0.1"
 className="h-9 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-2 text-sm"
 placeholder="Qty"
 />
 <input
 value={ing.unit ??""}
 onChange={(e) => updateIngredient(i, { unit: e.target.value.toLowerCase() || null })}
 className="h-9 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-2 text-sm"
 placeholder="Unit"
 />
 <input
 value={ing.grams ??""}
 onChange={(e) =>
 updateIngredient(i, {
 grams: e.target.value ? Number(e.target.value) : null,
 gramsSource: e.target.value ?"explicit" : null,
 })
 }
 type="number"
 min="0"
 step="1"
 className="h-9 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-2 text-sm"
 placeholder="g"
 />
 <button
 onClick={() => removeIngredient(i)}
 className="rounded-md text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500"
 aria-label="Remove ingredient"
 >
 <Trash2 className="mx-auto h-4 w-4" />
 </button>
 </div>
 {ing.rawText ? <p className="text-xs text-[var(--text-muted)]">Source: {ing.rawText}</p> : null}
 </div>
 ))}
 </div>

 <div className="mb-6">
 <div className="mb-2 flex items-center justify-between">
 <p className="text-sm font-medium text-[var(--text-secondary)]">Method</p>
 <button
 type="button"
 onClick={addStep}
 className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-primary)] hover:underline"
 >
 <Plus className="h-3 w-3" />
 Add step
 </button>
 </div>
 <div className="space-y-2">
 {result.steps.length === 0 ? (
 <p className="text-sm text-[var(--text-muted)]">No steps imported — add them if you like.</p>
 ) : null}
 {result.steps.map((stepText, i) => (
 <textarea
 key={`step-${i}`}
 value={stepText}
 onChange={(e) => updateStep(i, e.target.value)}
 rows={2}
 className="w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-2 py-1.5 text-sm"
 placeholder={`Step ${i + 1}`}
 />
 ))}
 </div>
 </div>

 <div className="flex gap-3">
 <button onClick={handleBackFromPreview} className="flex-1 rounded-xl border py-2.5 text-sm">
 Back
 </button>
 <button
 onClick={() => setStep("servings")}
 disabled={!result.name.trim()}
 className="flex-1 rounded-xl bg-[var(--btn-primary-bg)] py-2.5 text-sm font-medium text-[var(--btn-primary-text)] disabled:opacity-50"
 >
 Next
 </button>
 </div>
 {!hasValidIngredients ? (
 <p className="mt-2 text-xs text-amber-700">
 Add at least one ingredient on the next screen before saving, or go back to fill them in now.
 </p>
 ) : null}
 </>
 ) : null}

 {step ==="servings" && result ? (
 <>
 <div className="mb-4">
 <h3 className="font-semibold">{result.name}</h3>
 {detected > 1 ? (
 <p className="mt-1 text-sm text-[var(--text-muted)]">
 This recipe makes about {detected} servings. How many people are you cooking for?
 </p>
 ) : (
 <p className="mt-1 text-sm text-[var(--text-muted)]">How many people are these ingredient amounts for?</p>
 )}
 </div>

 <div className="mb-6 flex flex-wrap items-center gap-3">
 <span className="text-sm text-[var(--text-secondary)]">Cooking for</span>
 <button
 type="button"
 onClick={() => setCookingFor((n) => Math.max(1, n - 1))}
 className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] hover:bg-[var(--surface-muted)]"
 >
 −
 </button>
 <span className="w-8 text-center text-lg font-bold">{cookingFor}</span>
 <button
 type="button"
 onClick={() => setCookingFor((n) => Math.min(12, n + 1))}
 className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] hover:bg-[var(--surface-muted)]"
 >
 +
 </button>
 <span className="text-sm text-[var(--text-secondary)]">{cookingFor === 1 ?"person" :"people"}</span>
 </div>

 {cookingFor !== detected ? (
 <p className="mb-4 text-xs text-[var(--text-muted)]">
 Quantities will be scaled from {detected} serving{detected === 1 ?"" :"s"} to {cookingFor}.
 </p>
 ) : null}

 <div className="flex gap-3">
 <button
 type="button"
 onClick={() => setStep("preview")}
 className="flex-1 rounded-xl border py-2.5 text-sm"
 >
 Back
 </button>
 <button
 type="button"
 onClick={() => void handleConfirmImport()}
 disabled={saving || !hasValidIngredients}
 className="flex-1 rounded-xl bg-[var(--btn-primary-bg)] py-2.5 text-sm font-medium text-[var(--btn-primary-text)] disabled:opacity-50"
 >
 {saving ?"Saving..." :"Save recipe"}
 </button>
 </div>
 </>
 ) : null}

 {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
 </div>
 </div>
 );
}
