"use server";

import { headers } from "next/headers";
import { cleanCountry, parseHalalSignup } from "@/lib/waitlist/halal";
import { saveHalalSignup } from "@/lib/waitlist/halalStore";

export type HalalWaitlistState = { status: "idle" | "joined" } | { status: "error"; message: string };

export async function joinHalalWaitlist(_prev: HalalWaitlistState, form: FormData): Promise<HalalWaitlistState> {
  const signup = parseHalalSignup(form);
  if ("error" in signup) {
    // Bots are told they succeeded so they don't retry.
    if (signup.error === "bot") return { status: "joined" };
    return { status: "error", message: "Please check your email address and try again." };
  }
  const country = cleanCountry((await headers()).get("x-vercel-ip-country"));
  if (!(await saveHalalSignup(signup, country))) {
    return { status: "error", message: "We couldn't save that just now. Please try again in a minute." };
  }
  return { status: "joined" };
}
