"use client";

import { useEffect } from "react";
import { captureInstallPrompt } from "@/lib/pwa/installPrompt";

/** Mounted in the app layout so the browser's install offer is caught on any page. */
export function InstallPromptCapture() {
  useEffect(() => {
    captureInstallPrompt();
  }, []);
  return null;
}
