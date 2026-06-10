"use server";

import { toUserFacingError } from "@/lib/errors/userFacing";
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
    if (fallbackError) return { error: toUserFacingError(fallbackError, "grocery", "toggleGroceryItem") };
  } else if (error) {
    return { error: toUserFacingError(error, "grocery", "toggleGroceryItem") };
  }
  revalidatePath("/grocery");
  return { success: true };
}
