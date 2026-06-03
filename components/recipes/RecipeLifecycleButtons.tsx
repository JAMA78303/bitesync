"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { archiveRecipe, deleteRecipe } from "@/app/(app)/recipes/actions";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  recipeId: string;
};

export function RecipeLifecycleButtons({ recipeId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"archive" | "delete" | null>(null);

  function runAction(kind: "archive" | "delete") {
    if (kind === "delete") {
      const ok = window.confirm("Delete this recipe? This cannot be undone.");
      if (!ok) return;
    }

    setAction(kind);
    startTransition(async () => {
      const result = kind === "archive" ? await archiveRecipe(recipeId) : await deleteRecipe(recipeId);
      if (result && "error" in result) {
        setAction(null);
        toast({
          title: kind === "archive" ? "Archive failed" : "Delete failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      router.replace("/recipes");
      router.refresh();
    });
  }

  const busy = isPending;

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => runAction("archive")}
        disabled={busy}
        aria-label="Archive recipe"
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 text-lg text-gray-400 hover:text-amber-600 disabled:opacity-50 dark:border-gray-700"
      >
        {busy && action === "archive" ? "…" : "📦"}
      </button>
      <button
        type="button"
        onClick={() => runAction("delete")}
        disabled={busy}
        aria-label="Delete recipe"
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 text-lg text-gray-400 hover:text-red-500 disabled:opacity-50 dark:border-gray-700"
      >
        {busy && action === "delete" ? "…" : "🗑️"}
      </button>
    </div>
  );
}
