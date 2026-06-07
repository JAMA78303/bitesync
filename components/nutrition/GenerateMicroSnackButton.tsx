"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { generateMicroFocusedSnackDraft } from "@/app/(app)/recipes/actions";
import { PENDING_RECIPE_DRAFT_KEY } from "@/lib/recipes/pending-draft";

type Props = {
  nutrientKey: string;
  nutrientLabel: string;
};

export function GenerateMicroSnackButton({ nutrientKey, nutrientLabel }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const draftNonce =
        typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
          ? globalThis.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const result = await generateMicroFocusedSnackDraft({ nutrientKey, draftNonce });
      if ("error" in result && result.error) {
        window.alert(result.error);
        return;
      }
      if (!("success" in result) || !result.success || !result.data) {
        window.alert("Could not generate snack draft.");
        return;
      }

      sessionStorage.setItem(
        PENDING_RECIPE_DRAFT_KEY,
        JSON.stringify({
          ingredients: result.data.ingredients,
          name: result.data.name,
          mealSlot: "snack",
          label: nutrientLabel,
        }),
      );
      router.push("/recipes/new");
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="ml-6 mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1A4731] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#153928] disabled:opacity-60"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      Generate snack for {nutrientLabel.toLowerCase()}
    </button>
  );
}
