"use client";

import { useState } from "react";

type DeleteRecipeButtonProps = {
 onDelete: () => Promise<void>;
};

export function DeleteRecipeButton({ onDelete }: DeleteRecipeButtonProps) {
 const [isDeleting, setIsDeleting] = useState(false);

 async function handleClick() {
 const ok = window.confirm("Delete this recipe? This cannot be undone.");
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
