"use client";

import { useState, useTransition } from "react";
import { Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { createRecipe } from "@/app/(app)/recipes/actions";
import { ImportRecipeModal, type ImportResult } from "@/components/recipes/ImportRecipeModal";

export function ImportRecipeButton() {
  const [showImport, setShowImport] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleImport(result: ImportResult) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const ingredients = result.ingredients
          .map((ing) => ({
            name: ing.name.trim(),
            quantity: ing.quantity && Number.isFinite(ing.quantity) && ing.quantity > 0 ? ing.quantity : 1,
            unit: ing.unit?.trim() || "piece",
          }))
          .filter((ing) => ing.name.length > 0);

        const created = await createRecipe({
          name: result.name,
          description: `Imported from ${result.sourceDomain}`,
          ingredients,
          sourceUrl: result.sourceUrl,
          sourceDomain: result.sourceDomain,
          importedAt: new Date().toISOString(),
        });

        if ("error" in created) {
          reject(new Error(created.error));
          return;
        }

        setShowImport(false);
        router.refresh();
        resolve();
      });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowImport(true)}
        disabled={isPending}
        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 sm:flex-initial"
      >
        <LinkIcon className="h-4 w-4" />
        Import from URL
      </button>

      {showImport ? <ImportRecipeModal onClose={() => setShowImport(false)} onImport={handleImport} /> : null}
    </>
  );
}
