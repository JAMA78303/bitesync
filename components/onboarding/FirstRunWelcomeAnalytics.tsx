"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { trackFirstRunCompleted, trackWeekGenerated } from "@/lib/analytics/events";

/** Fires funnel events after first-run redirect (?welcome=1). */
export function FirstRunWelcomeAnalytics() {
  const searchParams = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (searchParams.get("welcome") !== "1") return;
    fired.current = true;
    trackFirstRunCompleted();
    trackWeekGenerated(searchParams.get("pro") === "1" ? "ai" : "heuristic");
  }, [searchParams]);

  return null;
}
