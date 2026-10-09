"use client";

import { useState, useTransition } from "react";
import { setPantryItemQuantity } from "@/app/(app)/pantry/actions";
import { formatPantryAmount, PANTRY_UNIT_OPTIONS, type PantryUnitInput } from "@/lib/pantry/units";
import { isStorePantryStaple } from "@/lib/pantry/staples";

type Props = {
  itemId: string;
  name: string;
  quantity: number | null;
  unit: string;
  onSaved: () => void;
};

/**
 * The amount on hand, editable in place. The pantry row used to read "Add a
 * quantity to subtract it from your grocery list" with nothing to tap — the
 * only way to record one was to know that the quick-add box parses "500g
 * rice", which nothing said. Amounts are stored in g / ml / pieces so the
 * grocery list can subtract them; kg and litres are accepted and converted.
 */
export function PantryAmountEditor({ itemId, name, quantity, unit, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(quantity != null ? String(quantity) : "");
  const [u, setU] = useState<PantryUnitInput>(
    (PANTRY_UNIT_OPTIONS.some((o) => o.value === unit) ? unit : "g") as PantryUnitInput,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(next: number | null) {
    setError(null);
    startTransition(async () => {
      const result = await setPantryItemQuantity(itemId, next, u);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEditing(false);
      onSaved();
    });
  }

  if (!editing) {
    const hasAmount = quantity != null && unit;
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-left text-xs text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-link)] hover:underline"
        aria-label={hasAmount ? `Change amount of ${name}` : `Add amount of ${name}`}
      >
        {hasAmount
          ? `${formatPantryAmount(quantity, unit)} · change`
          : isStorePantryStaple(name)
            ? "Staple — kept off your grocery list · add amount"
            : "Add an amount to subtract it from your grocery list"}
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(qty);
        if (!qty.trim() || !Number.isFinite(n) || n <= 0) {
          setError("Enter an amount above zero.");
          return;
        }
        save(n);
      }}
      className="mt-1 flex flex-wrap items-center gap-1.5"
    >
      <input
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        inputMode="decimal"
        placeholder="500"
        autoFocus
        aria-label={`Amount of ${name}`}
        className="h-8 w-20 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-2 text-xs text-[var(--text-primary)]"
      />
      <select
        value={u}
        onChange={(e) => setU(e.target.value as PantryUnitInput)}
        aria-label={`Unit for ${name}`}
        className="h-8 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-1.5 text-xs text-[var(--text-primary)]"
      >
        {PANTRY_UNIT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[var(--btn-primary-bg)] px-2.5 py-1 text-2xs font-semibold text-[var(--btn-primary-text)] disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      {quantity != null ? (
        <button
          type="button"
          onClick={() => save(null)}
          disabled={isPending}
          className="text-2xs font-medium text-[var(--text-muted)] hover:text-[var(--semantic-error-text)]"
        >
          Clear
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setError(null);
        }}
        disabled={isPending}
        className="text-2xs font-medium text-[var(--text-muted)]"
      >
        Cancel
      </button>
      {error ? <p className="w-full text-2xs text-[var(--semantic-error-text)]">{error}</p> : null}
    </form>
  );
}
