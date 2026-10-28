"use client";

import { useActionState } from "react";
import { joinHalalWaitlist, type HalalWaitlistState } from "@/app/halal/actions";
import { HALAL_WANTS } from "@/lib/waitlist/halal";
import { ds } from "@/lib/ui/classes";

const initial: HalalWaitlistState = { status: "idle" };

export function HalalWaitlistForm({ refCode }: { refCode: string | null }) {
  const [state, action, pending] = useActionState(joinHalalWaitlist, initial);

  if (state.status === "joined") {
    return (
      <div className={ds.formCard} role="status">
        <h2 className={ds.sectionTitle}>You&apos;re on the list</h2>
        <p className="text-sm text-[var(--text-secondary)]">We&apos;ll email you once, when it&apos;s ready.</p>
      </div>
    );
  }

  return (
    <form action={action} className={ds.formCard}>
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-[var(--semantic-error-text)]">
          {state.message}
        </p>
      ) : null}
      <div className="space-y-2">
        <label htmlFor="halal-email" className="block text-sm font-semibold text-[var(--text-primary)]">
          Email
        </label>
        <input id="halal-email" name="email" type="email" autoComplete="email" inputMode="email" required className={ds.input} />
      </div>
      <div className="space-y-2">
        <label htmlFor="halal-wants" className="block text-sm font-semibold text-[var(--text-primary)]">
          What would help you most?
        </label>
        <select id="halal-wants" name="wants" defaultValue="" className={ds.input}>
          <option value="">Choose one (optional)</option>
          {HALAL_WANTS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </div>
      {/* Honeypot: hidden from people, filled in by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="halal-website">Website</label>
        <input id="halal-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="ref" value={refCode ?? ""} />
      <button type="submit" disabled={pending} className={`${ds.primaryBtn} min-h-12 w-full disabled:opacity-60`}>
        {pending ? "Joining…" : "Join the waitlist"}
      </button>
      <p className="text-center text-xs text-[var(--text-muted)]">
        We only use your email to tell you when it launches.
      </p>
    </form>
  );
}
