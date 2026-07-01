"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toUserFacingError } from "@/lib/errors/userFacing";
import packageJson from "@/package.json";

export async function submitFeedback(input: {
  screen: string;
  message: string;
  expected?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const trimmed = input.message.trim();
  if (trimmed.length < 4) {
    return { error: "Please describe what happened in a few words." };
  }

  const headerList = await headers();
  const userAgent = headerList.get("user-agent");

  const { error } = await supabase.from("feedback_submissions").insert({
    user_id: user.id,
    screen: input.screen.slice(0, 200),
    message: trimmed.slice(0, 4000),
    expected: input.expected?.trim().slice(0, 2000) || null,
    app_version: packageJson.version,
    user_agent: userAgent?.slice(0, 500) ?? null,
  });

  if (error) {
    return { error: toUserFacingError(error, "profile", "submitFeedback") };
  }

  revalidatePath("/settings");
  return { success: true as const };
}
