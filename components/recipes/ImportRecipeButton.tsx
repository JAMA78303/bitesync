"use client";

import { useState, useTransition } from "react";
import { Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { createImportedRecipe } from "@/app/(app)/recipes/actions";
import { ImportRecipeModal, type ImportResult } from "@/components/recipes/ImportRecipeModal";
import {
  parsedIngredientsToInputs,
  scaleParsedIngredients,
} from "@/lib/recipes/parseIngredient";

function buildImportPayload(result: ImportResult) {
  const detected = Math.max(1, result.detectedServings ?? 1);
  const cookingFor = Math.max(1, result.cookingFor ?? 1);
  const scale = cookingFor / detected;
  const scaled = scaleParsedIngredients(result.ingredients, scale);
  const ingredients = parsedIngredientsToInputs(scaled);

  return {
    name: result.name,
    description: `Imported from ${result.sourceDomain}`,
    ingredients,
    steps: result.steps,
    sourceUrl: result.sourceUrl,
    sourceDomain: result.sourceDomain,
    sourceType: result.sourceType,
    importedAt: new Date().toISOString(),
    detectedServings: detected,
    cookingFor,
  };
}

export function ImportRecipeButton() {
  const [showImport, setShowImport] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleImport(result: ImportResult) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const payload = buildImportPayload(result);
        if (!payload.ingredients.length) {
          reject(new Error("Add at least one ingredient before saving."));
          return;
        }

        const created = await createImportedRecipe(payload);
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
