"use client";

import { useState } from "react";
import { useConfirm } from "@/components/ui/ConfirmDialog";

type DeleteRecipeButtonProps = {
 onDelete: () => Promise<void>;
};

export function DeleteRecipeButton({ onDelete }: DeleteRecipeButtonProps) {
 const [isDeleting, setIsDeleting] = useState(false);
 const { confirm } = useConfirm();

 async function handleClick() {
 const ok = await confirm({
 title: "Delete recipe?",
 description: "This cannot be undone.",
 confirmLabel: "Delete",
 destructive: true,
 });
 if (!ok) return;
 setIsDeleting(true);
 await onDelete();
 }

 return (
 <button
 type="button"
 onClick={handleClick}
 disabled={isDeleting}
 className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--semantic-error-border)] bg-[var(--semantic-error-bg)] px-3 text-sm font-medium text-[var(--semantic-error-text)] hover:opacity-85 disabled:opacity-70"
 >
 {isDeleting ?"Deleting..." :"Delete recipe"}
 </button>
 );
}
