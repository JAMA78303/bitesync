"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Loader2, Trash2 } from "lucide-react";
import { archiveRecipe, deleteRecipe } from "@/app/(app)/recipes/actions";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";

type Props = {
 recipeId: string;
};

export function RecipeLifecycleButtons({ recipeId }: Props) {
 const router = useRouter();
 const { toast } = useToast();
 const { confirm } = useConfirm();
 const [isPending, startTransition] = useTransition();
 const [action, setAction] = useState<"archive" |"delete" | null>(null);

 async function runAction(kind:"archive" |"delete") {
 if (kind ==="delete") {
 const ok = await confirm({
 title: "Delete recipe?",
 description: "This cannot be undone.",
 confirmLabel: "Delete",
 destructive: true,
 });
 if (!ok) return;
 }

 setAction(kind);
 startTransition(async () => {
 const result = kind ==="archive" ? await archiveRecipe(recipeId) : await deleteRecipe(recipeId);
 if (result &&"error" in result) {
 setAction(null);
 toast({
 title: kind ==="archive" ?"Archive failed" :"Delete failed",
 description: result.error,
 variant:"destructive",
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
 onClick={() => void runAction("archive")}
 disabled={busy}
 aria-label="Archive recipe"
 title="Archive recipe"
 className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)] disabled:opacity-50"
 >
 {busy && action ==="archive" ? <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden /> : <Archive className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />}
 </button>
 <button
 type="button"
 onClick={() => void runAction("delete")}
 disabled={busy}
 aria-label="Delete recipe"
 title="Delete recipe"
 className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] transition-colors hover:border-[var(--semantic-error-border)] hover:text-[var(--semantic-error-text)] disabled:opacity-50"
 >
 {busy && action ==="delete" ? <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden /> : <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />}
 </button>
 </div>
 );
}
