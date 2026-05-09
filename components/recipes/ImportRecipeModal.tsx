"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Link as LinkIcon, Loader2, Trash2, X } from "lucide-react";

export type ParsedIngredient = {
  rawText: string;
  name: string;
  quantity?: number;
  unit?: string;
};

export type ImportResult = {
  name: string;
  ingredients: ParsedIngredient[];
  sourceUrl: string;
  sourceDomain: string;
};

type Props = {
  onClose: () => void;
  onImport: (result: ImportResult) => Promise<void> | void;
};

export function ImportRecipeModal({ onClose, onImport }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const canImport = useMemo(() => url.trim().length > 0 && !loading, [url, loading]);

  async function handleFetch() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Import failed");
      setResult(data as ImportResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not import recipe. Try a different URL.";
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

  function updateIngredient(index: number, patch: Partial<ParsedIngredient>) {
    if (!result) return;
    setResult({
      ...result,
      ingredients: result.ingredients.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)),
    });
  }

  async function handleConfirm() {
    if (!result || saving) return;
    setSaving(true);
    setError("");
    try {
      await onImport({
        ...result,
        ingredients: result.ingredients.filter((i) => i.name.trim().length > 0),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save imported recipe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Import Recipe from URL</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100" aria-label="Close import modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!result ? (
          <>
            <p className="mb-4 text-sm text-gray-500">
              Paste a recipe URL. We only import the recipe name and ingredients, never instructions.
            </p>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-2">
                <LinkIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                  placeholder="https://www.bbcgoodfood.com/recipes/..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  autoFocus
                />
              </div>
              <button
                onClick={handleFetch}
                disabled={!canImport}
                className="flex items-center gap-2 rounded-xl bg-[#1A4731] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-base font-semibold">{result.name}</h3>
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#1A4731]"
              >
                <ExternalLink className="h-3 w-3" />
                View original on {result.sourceDomain}
              </a>
            </div>

            <p className="mb-2 text-sm font-medium text-gray-700">Ingredients ({result.ingredients.length})</p>
            <div className="mb-6 space-y-2">
              {result.ingredients.map((ing, i) => (
                <div key={`${ing.rawText}-${i}`} className="space-y-1 rounded-lg bg-gray-50 p-2">
                  <div className="grid gap-2 md:grid-cols-[1fr_110px_90px_36px]">
                    <input
                      value={ing.name}
                      onChange={(e) => updateIngredient(i, { name: e.target.value })}
                      className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
                      placeholder="Ingredient name"
                    />
                    <input
                      value={ing.quantity ?? ""}
                      onChange={(e) =>
                        updateIngredient(i, {
                          quantity: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      type="number"
                      min="0"
                      step="0.1"
                      className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
                      placeholder="Qty"
                    />
                    <input
                      value={ing.unit ?? ""}
                      onChange={(e) => updateIngredient(i, { unit: e.target.value.toLowerCase() || undefined })}
                      className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
                      placeholder="Unit"
                    />
                    <button
                      onClick={() => removeIngredient(i)}
                      className="rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500"
                      aria-label="Remove ingredient"
                    >
                      <Trash2 className="mx-auto h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">{ing.rawText}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setResult(null)} className="flex-1 rounded-xl border py-2.5 text-sm">
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving || result.ingredients.length === 0}
                className="flex-1 rounded-xl bg-[#1A4731] py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add to Recipes"}
              </button>
            </div>
          </>
        )}

        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
      </div>
    </div>
  );
}
