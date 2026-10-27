"use client";

import { useEffect } from "react";
import { unstable_isUnrecognizedActionError } from "next/navigation";
import { App } from "@capacitor/app";
import { isNativeApp } from "@/lib/native/bridge";
import { listenForReminderTaps, syncNativeReminders } from "@/lib/native/reminders";

/**
 * Background work for the iPhone app: opens the page a tapped reminder points
 * to, and re-plans reminders whenever the app opens or comes back to the
 * front. Renders nothing, and does nothing in a browser.
 */
export function NativeAppSync() {
  useEffect(() => {
    if (!isNativeApp()) return;
    const stopTaps = listenForReminderTaps();
    const sync = () => {
      syncNativeReminders().catch((err: unknown) => {
        // The app can sit in the background for days. After a deploy its page
        // calls server actions the new site no longer has, so load the new one.
        if (unstable_isUnrecognizedActionError(err)) window.location.reload();
        // Otherwise offline or signed out: keep what's scheduled and try on the next resume.
      });
    };
    sync();
    const resume = App.addListener("resume", sync);
    return () => {
      stopTaps();
      void resume.then((h) => h.remove());
    };
  }, []);

  return null;
}
