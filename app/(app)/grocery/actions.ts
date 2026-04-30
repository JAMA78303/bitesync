"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleGroceryItem(itemId: string, current: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("grocery_items")
    .update({ is_checked: !current })
    .eq("id", itemId)
    .is("archived_at", null);

  if (error && error.message.toLowerCase().includes("archived_at")) {
    const { error: fallbackError } = await supabase
      .from("grocery_items")
      .update({ is_checked: !current })
      .eq("id", itemId);
    if (fallbackError) return { error: fallbackError.message };
  } else if (error) {
    return { error: error.message };
  }
  revalidatePath("/grocery");
  return { success: true };
}
