"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Droplets, Dumbbell, Moon, Sunrise, X } from "lucide-react";
import { endRamadanMode, setFastingOnDate } from "@/app/(app)/settings/fasting/actions";
import { useToast } from "@/components/ui/use-toast";
import { HYDRATION_GLASSES, IFTAR_GUIDANCE, SUHOOR_GUIDANCE, TRAINING_TIP } from "@/lib/fasting/slots";
import { refreshNativeReminders } from "@/lib/native/reminders";
import { ds } from "@/lib/ui/classes";

export type FastingTodayInfo = {
  /** "Ramadan · day 3", "Monday fast" or "Fasting today". */
  title: string;
  /** "05:34" in the person's time zone, when a place is set. */
  suhoorEnds: string | null;
  iftarAt: string | null;
  lunchPlanned: boolean;
  noDeficit: boolean;
};

type Props = {
  todayISO: string;
  fasting: FastingTodayInfo | null;
  /** "Fasting today" switch: shown to people who've set up fasting, on days that aren't Ramadan or a weekly fast. */
  toggle: { on: boolean } | null;
  /** From six weeks before Ramadan, to people who haven't turned Ramadan mode on. */
  offer: { start: string; startLabel: string; daysToStart: number } | null;
  /** The week after Ramadan ends, while Ramadan mode is still on. */
  afterEid: boolean;
};

export function FastingTodayCards({ todayISO, fasting, toggle, offer, afterEid }: Props) {
  return (
    <div className="space-y-4">
      {afterEid ? <AfterEidCard /> : null}
      {offer ? <RamadanOfferCard {...offer} /> : null}
      {fasting ? <FastingDayCard info={fasting} /> : null}
      {toggle ? <FastingTodayToggle todayISO={todayISO} on={toggle.on} /> : null}
    </div>
  );
}

function FastingDayCard({ info }: { info: FastingTodayInfo }) {
  return (
    <article className={`${ds.card} p-5`} aria-labelledby="fasting-today-title">
      <span className={ds.sectionKicker}>FASTING TODAY</span>
      <h2 id="fasting-today-title" className={ds.sectionTitle}>
        {info.title}
      </h2>
      {info.suhoorEnds && info.iftarAt ? (
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--surface-brand-subtle)] px-3.5 py-3">
            <dt className={`flex items-center gap-1.5 ${ds.statLabel}`}>
              <Sunrise className="h-3.5 w-3.5" aria-hidden />
              Suhoor ends
            </dt>
            <dd className={ds.statValue}>{info.suhoorEnds}</dd>
          </div>
          <div className="rounded-2xl bg-[var(--surface-brand-subtle)] px-3.5 py-3">
            <dt className={`flex items-center gap-1.5 ${ds.statLabel}`}>
              <Moon className="h-3.5 w-3.5" aria-hidden />
              Iftar
            </dt>
            <dd className={ds.statValue}>{info.iftarAt}</dd>
          </div>
        </dl>
      ) : (
        <Link href="/settings/fasting" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-primary)]">
          Add your city for suhoor and iftar times
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}

      {info.lunchPlanned ? (
        <p className={`${ds.infoCallout} mt-4 rounded-xl px-3 py-2.5 text-sm`}>
          Today still has lunch planned.{" "}
          <Link href="/planner" className="font-semibold underline underline-offset-2">
            Plan the week again
          </Link>{" "}
          to get suhoor, iftar and a late snack instead.
        </p>
      ) : null}

      <ul className="mt-4 space-y-2.5 text-sm text-[var(--text-secondary)]">
        <li>
          <strong className="text-[var(--text-primary)]">Iftar:</strong> {IFTAR_GUIDANCE}
        </li>
        <li>
          <strong className="text-[var(--text-primary)]">Suhoor:</strong> {SUHOOR_GUIDANCE}
        </li>
        <li className="flex gap-2">
          <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden />
          <span>
            Aim for {HYDRATION_GLASSES.min}–{HYDRATION_GLASSES.max} glasses of fluid between iftar and suhoor, a glass or two
            at a time.
          </span>
        </li>
        <li className="flex gap-2">
          <Dumbbell className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden />
          <span>{TRAINING_TIP}</span>
        </li>
      </ul>
      {info.noDeficit ? (
        <p className={`mt-4 ${ds.tierMeta}`}>
          Planned without a calorie deficit on fasting days, from your health answer. If you take medicine or are unsure, check
          with your doctor or GP.
        </p>
      ) : null}
    </article>
  );
}

function FastingTodayToggle({ todayISO, on }: { todayISO: string; on: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(on);

  function flip(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const result = await setFastingOnDate(todayISO, next);
      if ("error" in result) {
        setChecked(!next);
        toast({ title: "Couldn't save", description: result.error, variant: "destructive" });
        return;
      }
      refreshNativeReminders();
      router.refresh();
    });
  }

  return (
    <label className={`${ds.card} flex min-h-14 cursor-pointer items-center justify-between gap-4 px-5 py-3`}>
      <span>
        <span className="block text-sm font-semibold text-[var(--text-primary)]">Fasting today</span>
        <span className="block text-xs text-[var(--text-muted)]">Today&apos;s meals become suhoor, iftar and a late snack.</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        disabled={isPending}
        className="h-5 w-5 shrink-0 accent-[var(--brand-primary)]"
        checked={checked}
        onChange={(e) => flip(e.target.checked)}
      />
    </label>
  );
}

const offerKey = (start: string) => `bitesync:ramadan-offer-dismissed:${start}`;

function RamadanOfferCard({ start, startLabel, daysToStart }: { start: string; startLabel: string; daysToStart: number }) {
  // Hidden until we know it wasn't dismissed, so it never flashes.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(offerKey(start)) !== "1");
    } catch {
      setVisible(true);
    }
  }, [start]);
  if (!visible) return null;

  const when = daysToStart > 0 ? `is expected to start on ${startLabel}` : "has started";
  return (
    <article className={`${ds.card} relative p-5`} aria-labelledby="ramadan-offer-title">
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          try {
            window.localStorage.setItem(offerKey(start), "1");
          } catch {
            // Private mode: it comes back next visit, which is fine.
          }
        }}
        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
        aria-label="Hide this"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <span className={ds.sectionKicker}>RAMADAN</span>
      <h2 id="ramadan-offer-title" className={`${ds.sectionTitle} pr-8`}>
        Keep your gains while fasting
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Ramadan {when}. Ramadan mode plans iftar, a late snack and suhoor at your local times, so you still hit your
        protein, and reminds you before Fajr.
      </p>
      <Link href="/settings/fasting" className={`${ds.primaryBtn} mt-4 w-full gap-1.5 sm:w-auto`}>
        Set up Ramadan mode
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}

function AfterEidCard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  return (
    <article className={`${ds.card} p-5`} aria-labelledby="after-eid-title">
      <span className={ds.sectionKicker}>EID MUBARAK</span>
      <h2 id="after-eid-title" className={ds.sectionTitle}>
        Back to normal meals?
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Ramadan is over. Your days are breakfast, lunch and dinner again; this turns Ramadan mode off until next year.
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await endRamadanMode();
            if ("error" in result) {
              toast({ title: "Couldn't save", description: result.error, variant: "destructive" });
              return;
            }
            refreshNativeReminders();
            router.refresh();
          })
        }
        className={`${ds.primaryBtn} mt-4 w-full sm:w-auto`}
      >
        {isPending ? "Saving…" : "Back to normal meals"}
      </button>
    </article>
  );
}
