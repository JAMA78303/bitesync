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
 className="inline-flex h-9 items-center justify-center rounded-md border border-red-300 bg-red-50 px-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-70"
 >
 {isDeleting ?"Deleting..." :"Delete recipe"}
 </button>
 );
}
