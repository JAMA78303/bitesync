"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { formatGroceryItem } from "@/lib/grocery/storeUnits";
import { deleteGroceryItem, toggleGroceryItem } from "@/lib/supabase/grocery";
import { useToast } from "@/components/ui/use-toast";

type Props = {
 id: string;
 name: string;
 quantity: number;
 unit: string;
 is_checked: boolean;
};

export function GroceryItem({
 id,
 name,
 quantity,
 unit,
 is_checked,
}: Props) {
 const [checked, setChecked] = useState(is_checked);
 const [isPending, startTransition] = useTransition();
 const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const { toast } = useToast();

 function handleToggle() {
 const newChecked = !checked;
 setChecked(newChecked);

 if (debounceRef.current) clearTimeout(debounceRef.current);
 debounceRef.current = setTimeout(() => {
 startTransition(async () => {
 const result = await toggleGroceryItem(id, newChecked);
 if (result &&"error" in result) {
 setChecked(!newChecked);
 toast({
 title:"Failed to save",
 description:"Check your connection and try again.",
 variant:"destructive",
 });
 }
 });
 }, 300);
 }

 function handleDelete() {
 startTransition(async () => {
 const result = await deleteGroceryItem(id);
 if (result &&"error" in result) {
 toast({
 title:"Failed to delete",
 description:"Check your connection and try again.",
 variant:"destructive",
 });
 }
 });
 }

  return (
 <div
 className={`flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3.5 shadow-sm transition-opacity ${
 checked ?"opacity-40" :""
 } ${isPending ?"opacity-50" :""}`}
 >
 <button
 type="button"
 onClick={handleToggle}
 disabled={isPending}
 aria-pressed={checked}
 aria-label={`${checked ?"Uncheck" :"Check"} ${name}`}
 className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
 checked ?"border-[var(--brand-primary)] bg-[var(--brand-primary)]" :"border-[var(--border-default)]"
 }`}
 >
 {checked ? <Check className="h-3 w-3 text-[var(--text-on-brand)]" strokeWidth={3} /> : null}
 </button>

 <button
 type="button"
 onClick={handleToggle}
 disabled={isPending}
 className="min-w-0 flex-1 text-left"
 >
 <p
 className={`truncate text-sm font-medium ${
 checked ?"line-through text-[var(--text-muted)]" :"text-[var(--text-primary)]"
 }`}
 >
 {formatGroceryItem(name, quantity, unit)}
 </p>
      </button>

 <button
 type="button"
 onClick={handleDelete}
 disabled={isPending}
 aria-label={`Delete ${name}`}
 className="flex-shrink-0 rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--semantic-error-bg)] hover:text-[var(--semantic-error-text)]"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 );
}
