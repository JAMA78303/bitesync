import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/profile";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { FirstRunWizard } from "@/components/onboarding/FirstRunWizard";
import { clampFirstRunStep, FIRST_RUN_STEP } from "@/lib/onboarding/first-run";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  let profile = null;
  try {
    profile = await getProfile();
  } catch (error) {
    console.error("[onboarding] getProfile failed", error);
  }
  if (profile?.first_run_completed) {
    redirect("/today");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let recipeCount = 0;
  let recipePreview: string[] = [];
  if (user) {
    const { data, count } = await supabase
      .from("recipes")
      .select("name", { count: "exact" })
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: true })
      .limit(4);
    recipeCount = count ?? 0;
    recipePreview = (data ?? []).map((r) => r.name);
  }

  const step = clampFirstRunStep(profile?.onboarding_step);
  const resumeStep = step >= FIRST_RUN_STEP.WEEK ? 3 : step === FIRST_RUN_STEP.LIBRARY ? 2 : 1;

  return (
    <FirstRunWizard
      profile={profile}
      isPro={isProSubscriptionStatus(profile?.subscription_status)}
      recipeCount={recipeCount}
      recipePreview={recipePreview}
      key={resumeStep}
    />
  );
}
