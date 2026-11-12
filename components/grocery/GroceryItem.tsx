"use client";

import { useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { formatGroceryItem } from "@/lib/grocery/storeUnits";
import { deleteGroceryItem } from "@/lib/supabase/grocery-actions";
import { useGroceryTicks } from "@/components/grocery/GroceryTicks";
import { useToast } from "@/components/ui/use-toast";
import { tapFeedback } from "@/lib/native/bridge";

type Props = {
 id: string;
 name: string;
 quantity: number;
 unit: string;
 /** A row inside a list card (the grocery page) rather than a card of its own. */
 inList?: boolean;
};

/** One item. Ticked or not comes from GroceryTicksProvider, which also saves the tick. */
export function GroceryItem({
 id,
 name,
 quantity,
 unit,
 inList = false,
}: Props) {
 const ticks = useGroceryTicks();
 const checked = ticks.isChecked(id);
 const [isPending, startTransition] = useTransition();
 const { toast } = useToast();

 function handleToggle() {
 ticks.toggle(id);
 tapFeedback();
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
 className={`flex items-center gap-3 transition-opacity ${
 inList
 ? "px-4 py-3 md:px-5"
 : "rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3.5 shadow-sm"
 } ${
 checked ?"opacity-40" :""
 } ${isPending ?"opacity-50" :""}`}
 >
 <button
 type="button"
 onClick={handleToggle}
 disabled={isPending}
 aria-pressed={checked}
 aria-label={`${checked ?"Uncheck" :"Check"} ${name}`}
 className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
 checked ?"border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)]" :"border-[var(--border-default)]"
 }`}
 >
 {checked ? <Check className="h-3 w-3 text-[var(--btn-primary-text)]" strokeWidth={3} /> : null}
 </button>

 <button
 type="button"
 onClick={handleToggle}
 disabled={isPending}
 className="min-w-0 flex-1 text-left"
 >
 <p
 className={`line-clamp-2 text-sm font-medium ${
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
