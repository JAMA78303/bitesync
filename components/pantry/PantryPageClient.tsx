"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MealMatchSuggestions } from "@/components/matching/MealMatchSuggestions";
import {
  addPantryItemsFromText,
  addPantryStaple,
  deletePantryItem,
  seedCommonPantryStaples,
  setPantryRunningLow,
  suggestMealsFromPantry,
} from "@/app/(app)/pantry/actions";
import { PANTRY_STAPLES, type PantryItemRow } from "@/lib/pantry/constants";
import { ds } from "@/lib/ui/classes";

type Props = {
  items: PantryItemRow[];
};

export function PantryPageClient({ items }: Props) {
  const router = useRouter();
  const [bulkText, setBulkText] = useState("");
  const [isPending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleBulkAdd() {
    if (!bulkText.trim()) return;
    startTransition(async () => {
      await addPantryItemsFromText(bulkText);
      setBulkText("");
      refresh();
    });
  }

  function handleStaple(name: string) {
    startTransition(async () => {
      await addPantryStaple(name);
      refresh();
    });
  }

  function handleSeedStaples() {
    startTransition(async () => {
      await seedCommonPantryStaples();
      refresh();
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await deletePantryItem(id);
      refresh();
    });
  }

  function handleToggleLow(id: string, next: boolean) {
    startTransition(async () => {
      await setPantryRunningLow(id, next);
      refresh();
    });
  }

  const existing = new Set(items.map((item) => item.name.toLowerCase()));
  const quickStaples = PANTRY_STAPLES.filter((name) => !existing.has(name.toLowerCase())).slice(0, 8);

  return (
    <div className="space-y-4">
      <div className={`${ds.card} ${ds.cardPadding} space-y-3`}>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Quick add</h2>
        <p className="text-xs text-gray-500">
          Type what you have — comma-separated works: chicken, rice, broccoli, eggs
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={2}
          placeholder="chicken, rice, broccoli, eggs…"
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#3a5a40] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleBulkAdd}
            disabled={isPending || !bulkText.trim()}
            className={`${ds.primaryBtn} px-4 py-2 text-sm disabled:opacity-60`}
          >
            Add to pantry
          </button>
          <button
            type="button"
            onClick={handleSeedStaples}
            disabled={isPending}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
          >
            Add common staples
          </button>
        </div>
        {quickStaples.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {quickStaples.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleStaple(name)}
                disabled={isPending}
                className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:border-[#3a5a40] hover:text-[#3a5a40] disabled:opacity-60 dark:border-gray-700 dark:text-gray-400"
              >
                + {name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={`${ds.card} ${ds.cardPadding}`}>
        <h2 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">
          In your pantry ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing here yet — add a few staples above.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 dark:border-gray-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                  {item.quantity != null && item.unit ? (
                    <p className="text-xs text-gray-400">
                      {item.quantity} {item.unit}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleLow(item.id, !item.running_low)}
                    disabled={isPending}
                    title="Mark running low"
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      item.running_low
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    }`}
                  >
                    {item.running_low ? "Low" : "OK"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={isPending}
                    aria-label={`Remove ${item.name}`}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <MealMatchSuggestions
        title="Cook from my pantry"
        sourceLabel="Matches your saved recipes by ingredient overlap"
        emptyHint="Add pantry items, then suggest meals you can make with what you have."
        onSuggest={async () => {
          const result = await suggestMealsFromPantry();
          if ("error" in result) return { error: result.error };
          return { data: result.data };
        }}
      />
    </div>
  );
}
