import { groupByAisle } from "@/lib/grocery/aisles";
import { formatGroceryItem } from "@/lib/grocery/storeUnits";

type ShareItem = { name: string; quantity?: number | null; unit?: string | null };

/**
 * Plain text for sharing a grocery list (Messages, WhatsApp, Notes, email):
 * what's still to buy, grouped as on screen, with the same shopping units.
 */
export function groceryShareText(weekLabel: string, items: ShareItem[]): string {
  const lines = ["Grocery list", weekLabel];
  for (const group of groupByAisle(items)) {
    lines.push("", group.label.toUpperCase());
    for (const item of group.items) {
      lines.push(`• ${formatGroceryItem(item.name, item.quantity ?? undefined, item.unit ?? undefined)}`);
    }
  }
  lines.push("", "Planned with BiteSync · bitesync.io");
  return lines.join("\n");
}
