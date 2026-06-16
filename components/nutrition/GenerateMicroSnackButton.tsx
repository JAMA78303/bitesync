"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { generateMicroFocusedSnackDraft } from "@/app/(app)/recipes/actions";
import { useToast } from "@/components/ui/use-toast";
import { PENDING_RECIPE_DRAFT_KEY } from "@/lib/recipes/pending-draft";

type Props = {
 nutrientKey: string;
 nutrientLabel: string;
};

export function GenerateMicroSnackButton({ nutrientKey, nutrientLabel }: Props) {
 const router = useRouter();
 const [isPending, startTransition] = useTransition();
 const { toast } = useToast();

 function handleClick() {
 startTransition(async () => {
 const draftNonce =
 typeof globalThis.crypto !=="undefined" &&"randomUUID" in globalThis.crypto
 ? globalThis.crypto.randomUUID()
 : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

 const result = await generateMicroFocusedSnackDraft({ nutrientKey, draftNonce });
 if ("error" in result && result.error) {
 toast({ title: "Could not generate snack", description: result.error, variant: "destructive" });
 return;
 }
 if (!("success" in result) || !result.success || !result.data) {
 toast({
 title: "Could not generate snack",
 description: "Try again or create a snack manually.",
 variant: "destructive",
 });
 return;
 }

 sessionStorage.setItem(
 PENDING_RECIPE_DRAFT_KEY,
 JSON.stringify({
 ingredients: result.data.ingredients,
 name: result.data.name,
 mealSlot:"snack",
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
 className="ml-6 mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--btn-primary-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-60"
 >
 {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
 Generate snack for {nutrientLabel.toLowerCase()}
 </button>
 );
}
