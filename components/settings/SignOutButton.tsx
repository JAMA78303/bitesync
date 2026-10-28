"use client";

import { logout } from "@/app/(app)/settings/actions";
import { clearNativeAccountData } from "@/lib/native/reminders";

/**
 * Sign out. In the iPhone app it first stops this phone's reminders and
 * forgets the saved grocery list, so the next person to use the phone
 * doesn't get them. In a browser it just signs out.
 */
export function SignOutButton() {
  return (
    <form
      action={async () => {
        await clearNativeAccountData();
        await logout();
      }}
    >
      <button
        type="submit"
        className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] py-3.5 text-sm font-semibold text-[var(--text-secondary)]"
      >
        Sign out
      </button>
    </form>
  );
}
