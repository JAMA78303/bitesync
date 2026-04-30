"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addManualGroceryItem } from "@/lib/supabase/grocery";
import { useToast } from "@/components/ui/use-toast";
import { ALLOWED_UNITS } from "@/types";

type Props = { mealPlanId: string };

export function ManualGroceryAdd({ mealPlanId }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("piece");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function reset() {
    setName("");
    setQuantity("");
    setUnit("piece");
    setOpen(false);
  }

  function handleAdd() {
    if (!name.trim() || !quantity) return;
    startTransition(async () => {
      const parsedQuantity = Number.parseFloat(quantity);
      const result = await addManualGroceryItem(mealPlanId, name.trim(), parsedQuantity, unit);
      if (result?.error) {
        toast({
          title: "Failed to add item",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: `${name} added` });
      reset();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400 transition-all duration-150 hover:bg-[#F0FDF4] hover:text-[#1A4731]"
      >
        <Plus className="h-4 w-4" />
        Add item manually
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#6EE7B7] bg-[#F0FDF4] p-4">
      <p className="text-xs font-semibold text-[#1A4731]">Add item</p>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name e.g. Olive oil"
        className="h-9 bg-white text-sm"
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <div className="flex gap-2">
        <Input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Qty"
          type="number"
          min="0.1"
          step="0.1"
          className="h-9 w-24 bg-white text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
          }}
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="h-9 flex-1 rounded-md border border-input bg-white px-3 text-sm"
        >
          {ALLOWED_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim() || !quantity || isPending}
          className="h-9 flex-1 bg-[#1A4731] text-sm text-white hover:bg-[#153928]"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to list"}
        </Button>
        <Button type="button" variant="outline" onClick={reset} className="h-9 text-sm">
          Cancel
        </Button>
      </div>
    </div>
  );
}
