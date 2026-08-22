import {
  pantryCoversIngredient,
  type AvailableIngredient,
} from "@/lib/matching/ingredient-overlap";
import { normalizeUnitLabel } from "@/lib/utils/merge";
import { isStorePantryStaple } from "@/lib/pantry/staples";

export type ShoppingLine = { name: string; quantity: number; unit: string };

export type PantryApplyResult = {
  items: ShoppingLine[];
  omittedCount: number;
  reducedCount: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function findBestPantryMatch(lineName: string, pantry: AvailableIngredient[]): AvailableIngredient | null {
  for (const item of pantry) {
    if (item.runningLow) continue;
    if (pantryCoversIngredient(item.name, lineName)) return item;
  }
  return null;
}

function subtractQuantity(line: ShoppingLine, pantryItem: AvailableIngredient): ShoppingLine | null {
  const pantryQty = pantryItem.quantity;
  if (pantryQty == null || !Number.isFinite(Number(pantryQty))) {
    // No recorded amount. Assuming "enough" is only safe for store-cupboard
    // staples; for a perishable it hid 980g of chicken behind one quick-add tap.
    return isStorePantryStaple(pantryItem.name) ? null : line;
  }

  const needUnit = normalizeUnitLabel(line.unit);
  const haveUnit = normalizeUnitLabel(pantryItem.unit ?? "");
  if (needUnit !== haveUnit) {
    return line;
  }

  const remaining = line.quantity - Number(pantryQty);
  if (remaining <= 0.01) return null;
  return { ...line, quantity: round2(remaining) };
}

/** Drop or reduce shopping lines when matching pantry stock is available (not running low). */
export function applyPantryToShoppingList(lines: ShoppingLine[], pantry: AvailableIngredient[]): PantryApplyResult {
  if (!pantry.length) {
    return { items: lines, omittedCount: 0, reducedCount: 0 };
  }

  let omittedCount = 0;
  let reducedCount = 0;
  const items: ShoppingLine[] = [];

  for (const line of lines) {
    const match = findBestPantryMatch(line.name, pantry);
    if (!match) {
      items.push(line);
      continue;
    }

    const adjusted = subtractQuantity(line, match);
    if (adjusted === null) {
      omittedCount += 1;
      continue;
    }
    if (adjusted.quantity < line.quantity) {
      reducedCount += 1;
    }
    items.push(adjusted);
  }

  return { items, omittedCount, reducedCount };
}
