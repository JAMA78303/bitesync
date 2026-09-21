import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvailableIngredient } from "@/lib/matching/ingredient-overlap";
import type { PantryItemRow } from "@/lib/pantry/constants";
import { PANTRY_STAPLES } from "@/lib/pantry/constants";
import { toUserFacingError } from "@/lib/errors/userFacing";
import { createClient } from "@/lib/supabase/server";

export type { PantryItemRow } from "@/lib/pantry/constants";
export { PANTRY_STAPLES } from "@/lib/pantry/constants";

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function pantryRowToAvailable(row: PantryItemRow): AvailableIngredient {
  return {
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    runningLow: row.running_low,
  };
}

const PANTRY_SELECT = "id,user_id,name,quantity,unit,running_low,archived_at,created_at,updated_at";

export async function fetchPantryAvailableForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<AvailableIngredient[]> {
  const { data, error } = await supabase
    .from("pantry_items")
    .select(PANTRY_SELECT)
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) return [];
  return ((data as PantryItemRow[]) ?? []).map(pantryRowToAvailable);
}

export async function getPantryItems(): Promise<PantryItemRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("pantry_items")
    .select(PANTRY_SELECT)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) return [];
  return (data as PantryItemRow[]) ?? [];
}

export async function addPantryItem(payload: {
  name: string;
  quantity?: number | null;
  unit?: string;
  runningLow?: boolean;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const name = toTitleCase(payload.name.trim());
  if (!name) return { error: "Enter an ingredient name" };

  const { error } = await supabase.from("pantry_items").insert({
    user_id: user.id,
    name,
    quantity: payload.quantity ?? null,
    unit: (payload.unit ?? "").trim(),
    running_low: payload.runningLow ?? false,
  });

  if (error) return { error: toUserFacingError(error, "pantry", "pantryDb") };

  revalidatePath("/pantry");
  return {};
}

export async function removePantryItem(itemId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("pantry_items")
    .update({ archived_at: now, updated_at: now })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return { error: toUserFacingError(error, "pantry", "pantryDb") };

  revalidatePath("/pantry");
  return {};
}

export async function togglePantryRunningLow(
  itemId: string,
  runningLow: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("pantry_items")
    .update({ running_low: runningLow, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return { error: toUserFacingError(error, "pantry", "pantryDb") };

  revalidatePath("/pantry");
  return {};
}

/** Set or clear the amount on hand. Null quantity clears it. */
export async function setPantryItemAmount(
  itemId: string,
  quantity: number | null,
  unit: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("pantry_items")
    .update({ quantity, unit, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return { error: toUserFacingError(error, "pantry", "pantryDb") };

  revalidatePath("/pantry");
  revalidatePath("/grocery");
  return {};
}

export async function seedPantryStaples(): Promise<{ error?: string; added?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const existing = await getPantryItems();
  const have = new Set(existing.map((row) => row.name.toLowerCase()));

  const toInsert = PANTRY_STAPLES.filter((name) => !have.has(name.toLowerCase())).map((name) => ({
    user_id: user.id,
    name: toTitleCase(name),
    quantity: null,
    unit: "",
    running_low: false,
  }));

  if (!toInsert.length) return { added: 0 };

  const { error } = await supabase.from("pantry_items").insert(toInsert);
  if (error) return { error: toUserFacingError(error, "pantry", "pantryDb") };

  revalidatePath("/pantry");
  return { added: toInsert.length };
}
