"use server";

import { revalidatePath } from "next/cache";
import { recordAppEvent } from "@/lib/analytics/recordAppEvent";
import { isNativeAppRequest } from "@/lib/native/server";
import { photoLoggingVisible } from "@/lib/photoMeal/access";
import { saveLoggedMeal, saveLoggedMealInput } from "@/lib/photoMeal/save";
import { createClient } from "@/lib/supabase/server";

/** "Add to today" on the photo review screen. */
export async function savePhotoMeal(raw: unknown): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  if (!(await photoLoggingVisible(user.id))) return { error: "Photo logging isn't available on your account." };

  const parsed = saveLoggedMealInput.safeParse(raw);
  if (!parsed.success) return { error: "Check the foods and weights, then try again." };

  const result = await saveLoggedMeal(supabase, user.id, parsed.data);
  if ("error" in result) return result;

  await recordAppEvent({
    name: "photo_log_saved",
    props: {
      items: parsed.data.items.length,
      replaced: parsed.data.replaceEntryId !== null,
      meal: parsed.data.mealType,
    },
    userId: user.id,
    platform: (await isNativeAppRequest()) ? "ios" : "web",
  });

  revalidatePath("/today");
  revalidatePath("/planner");
  revalidatePath("/nutrition");
  return { success: true };
}
