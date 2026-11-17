"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, X } from "lucide-react";
import { saveFastingSettings } from "@/app/(app)/settings/fasting/actions";
import { useToast } from "@/components/ui/use-toast";
import type { FastingPresetId, RamadanDates } from "@/lib/fasting/hijri";
import { formatClock, formatShortDate, isIsoDate } from "@/lib/fasting/isoDate";
import { searchPlaces, type Place } from "@/lib/fasting/places";
import { CALCULATION_METHOD_IDS, CALCULATION_METHODS, fastingTimes } from "@/lib/fasting/prayerTimes";
import { DEFAULT_FASTING_SETTINGS, MAX_OFFSET_MINUTES, type FastingSettings } from "@/lib/fasting/settings";
import { SUHOOR_REMINDER_MINUTES } from "@/lib/fasting/slots";
import { isNativeApp } from "@/lib/native/bridge";
import { ensureNativeNotificationPermission, refreshNativeReminders } from "@/lib/native/reminders";
import { ds } from "@/lib/ui/classes";

const SAFETY_QUESTIONS = [
  "Diabetes treated with medicine",
  "Pregnant or breastfeeding",
  "Under 18",
  "A history of an eating disorder",
  "Kidney disease",
];

const WEEKDAYS: { index: number; label: string }[] = [
  { index: 0, label: "Every Monday" },
  { index: 3, label: "Every Thursday" },
];

type Props = {
  initial: FastingSettings | null;
  expectedRamadan: RamadanDates | null;
  presets: { id: FastingPresetId; label: string; detail: string; dates: string[] }[];
  todayISO: string;
};

function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_FASTING_SETTINGS.timeZone;
  } catch {
    return DEFAULT_FASTING_SETTINGS.timeZone;
  }
}

export function FastingSettingsForm({ initial, expectedRamadan, presets, todayISO }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [native, setNative] = useState(false);
  useEffect(() => setNative(isNativeApp()), []);

  const base = initial ?? DEFAULT_FASTING_SETTINGS;
  const [s, setS] = useState<FastingSettings>(() => ({
    ...base,
    timeZone: initial ? base.timeZone : deviceTimeZone(),
  }));
  const update = (patch: Partial<FastingSettings>) => setS((prev) => ({ ...prev, ...patch }));

  // Safety screen: answered before anything else, kept as one yes/no.
  const [safetyAnswered, setSafetyAnswered] = useState(Boolean(initial?.safetyCheckedAt));
  const [ticked, setTicked] = useState<string[]>([]);
  const [askingAgain, setAskingAgain] = useState(false);

  const [start, setStart] = useState(base.ramadanStart ?? expectedRamadan?.start ?? "");
  const [end, setEnd] = useState(base.ramadanEnd ?? expectedRamadan?.end ?? "");
  const [query, setQuery] = useState("");
  const [placeFromDevice, setPlaceFromDevice] = useState(false);
  const [locating, setLocating] = useState(false);
  const [newDay, setNewDay] = useState("");
  const results = useMemo(() => searchPlaces(query), [query]);

  const previewDay = expectedRamadan && todayISO < (start || expectedRamadan.start) ? start || expectedRamadan.start : todayISO;
  const preview = s.place
    ? fastingTimes(previewDay, {
        latitude: s.place.latitude,
        longitude: s.place.longitude,
        method: s.method,
        fajrOffsetMinutes: s.fajrOffsetMinutes,
        maghribOffsetMinutes: s.maghribOffsetMinutes,
      })
    : null;

  function answerSafety() {
    update({ noDeficit: ticked.length > 0 });
    setSafetyAnswered(true);
    setAskingAgain(false);
  }

  function pickPlace(place: Place) {
    update({
      place: { name: `${place.name}, ${place.country}`, latitude: place.latitude, longitude: place.longitude },
      timeZone: place.timeZone,
      method: place.method,
    });
    setPlaceFromDevice(false);
    setQuery("");
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast({ title: "Location isn't available", description: "Search for your city instead." });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        update({
          place: { name: "My location", latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          timeZone: deviceTimeZone(),
        });
        setPlaceFromDevice(true);
      },
      () => {
        setLocating(false);
        toast({ title: "Couldn't get your location", description: "Search for your city instead." });
      },
      { maximumAge: 600_000, timeout: 10_000 },
    );
  }

  function toggleDates(dates: string[], on: boolean) {
    const set = new Set(s.extraDays);
    for (const d of dates) {
      if (on) set.add(d);
      else set.delete(d);
    }
    update({ extraDays: [...set].sort() });
  }

  function save() {
    // Dates left at the expected ones are stored as "expected", so next year starts fresh.
    const sameAsExpected = expectedRamadan && start === expectedRamadan.start && end === expectedRamadan.end;
    const ownDates = !sameAsExpected && isIsoDate(start) && isIsoDate(end);
    startTransition(async () => {
      const result = await saveFastingSettings({
        ...s,
        ramadanStart: ownDates ? start : null,
        ramadanEnd: ownDates ? end : null,
        safetyAnswered,
        placeFromDevice,
      });
      if ("error" in result) {
        toast({ title: "Couldn't save", description: result.error, variant: "destructive" });
        return;
      }
      if (native && (s.suhoorReminder || s.iftarPlanReminder)) {
        await ensureNativeNotificationPermission().catch(() => {});
      }
      refreshNativeReminders();
      toast({ title: "Saved", description: s.ramadanOn ? "Ramadan mode is on." : "Your fasting days are saved." });
      router.refresh();
    });
  }

  if (!safetyAnswered || askingAgain) {
    return (
      <section className={`${ds.card} ${ds.cardPadding} space-y-4`} aria-labelledby="safety-title">
        <div>
          <h2 id="safety-title" className={ds.cardTitle}>
            Before you start
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Do any of these apply to you?</p>
        </div>
        <ul className="space-y-2">
          {SAFETY_QUESTIONS.map((q) => {
            const checked = ticked.includes(q);
            return (
              <li key={q}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--brand-primary)]"
                    checked={checked}
                    onChange={(e) => setTicked((prev) => (e.target.checked ? [...prev, q] : prev.filter((x) => x !== q)))}
                  />
                  {q}
                </label>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-[var(--text-muted)]">
          BiteSync keeps only whether you ticked anything, not which. It isn&apos;t medical advice.
        </p>
        <button type="button" onClick={answerSafety} className={`${ds.primaryBtn} w-full`}>
          {ticked.length ? "Continue" : "None of these apply"}
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {s.noDeficit ? (
        <p className={`${ds.warnCallout} rounded-2xl px-4 py-3 text-sm`}>
          Fasting can change what&apos;s safe for you. Please speak to your doctor or GP before Ramadan. BiteSync will
          still plan your meals, without a calorie deficit on fasting days.
        </p>
      ) : null}

      <section className={`${ds.card} ${ds.cardPadding} space-y-4`} aria-labelledby="ramadan-title">
        <label className="flex items-start justify-between gap-4">
          <span>
            <span id="ramadan-title" className={`block ${ds.cardTitle}`}>
              Ramadan mode
            </span>
            <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
              Suhoor, iftar and a late snack at your local times, with your protein spread across them.
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--brand-primary)]"
            checked={s.ramadanOn}
            onChange={(e) => update({ ramadanOn: e.target.checked })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            First day of fasting
            <input type="date" className={`${ds.input} mt-1 w-full`} value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            Last day of fasting
            <input type="date" className={`${ds.input} mt-1 w-full`} value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>
        {expectedRamadan ? (
          <p className="text-xs text-[var(--text-muted)]">
            Expected from the Umm al-Qura calendar: {formatShortDate(expectedRamadan.start)} to{" "}
            {formatShortDate(expectedRamadan.end)}. Change them to match your local moon sighting.
          </p>
        ) : null}
      </section>

      <section className={`${ds.card} ${ds.cardPadding} space-y-4`} aria-labelledby="place-title">
        <div>
          <h2 id="place-title" className={ds.cardTitle}>
            Prayer times
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            For suhoor and iftar times. BiteSync works them out itself from the place you pick, so no prayer-times
            service sees it.
          </p>
        </div>
        {s.place ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-brand-subtle)] px-3 py-2.5">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{s.place.name}</span>
            <button
              type="button"
              onClick={() => update({ place: null })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              aria-label="Clear place"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
        <div>
          <label htmlFor="place-search" className="text-xs font-medium text-[var(--text-secondary)]">
            {s.place ? "Change city" : "Your city"}
          </label>
          <input
            id="place-search"
            type="search"
            autoComplete="off"
            className={`${ds.input} mt-1 w-full`}
            placeholder="e.g. Birmingham"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length ? (
            <ul className="mt-2 overflow-hidden rounded-xl border border-[var(--border-subtle)]">
              {results.map((place) => (
                <li key={`${place.name}-${place.country}`}>
                  <button
                    type="button"
                    onClick={() => pickPlace(place)}
                    className="flex min-h-11 w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)]"
                  >
                    <span className="font-semibold text-[var(--text-primary)]">{place.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">{place.country}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Not in the list. Pick the nearest big city{native ? "" : " or use your location"}.
            </p>
          ) : null}
          {native ? null : (
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className={`${ds.secondaryBtn} mt-2 min-h-10 gap-1.5 px-3.5 py-2 text-xs`}
            >
              <LocateFixed className="h-3.5 w-3.5" aria-hidden />
              {locating ? "Finding you…" : "Use my location"}
            </button>
          )}
        </div>
        <label className="block text-xs font-medium text-[var(--text-secondary)]">
          Calculation method
          <select
            className={`${ds.input} mt-1 w-full`}
            value={s.method}
            onChange={(e) => update({ method: e.target.value as FastingSettings["method"] })}
          >
            {CALCULATION_METHOD_IDS.map((id) => (
              <option key={id} value={id}>
                {CALCULATION_METHODS[id].label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["fajrOffsetMinutes", "Adjust Fajr (min)"],
              ["maghribOffsetMinutes", "Adjust Maghrib (min)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-xs font-medium text-[var(--text-secondary)]">
              {label}
              <input
                type="number"
                inputMode="numeric"
                min={-MAX_OFFSET_MINUTES}
                max={MAX_OFFSET_MINUTES}
                className={`${ds.input} mt-1 w-full`}
                value={s[key]}
                onChange={(e) => {
                  const n = Math.round(Number(e.target.value));
                  update({ [key]: Number.isFinite(n) ? Math.max(-MAX_OFFSET_MINUTES, Math.min(MAX_OFFSET_MINUTES, n)) : 0 });
                }}
              />
            </label>
          ))}
        </div>
        {s.place ? (
          preview ? (
            <p className="rounded-xl bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-[var(--text-primary)]">
              {formatShortDate(previewDay)}: suhoor ends at <strong>{formatClock(preview.fajr, s.timeZone)}</strong> (Fajr),
              iftar at <strong>{formatClock(preview.maghrib, s.timeZone)}</strong>
              {" (Maghrib). Use the adjustments to match your mosque's timetable."}
            </p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">The sun doesn&apos;t set or rise here on this date.</p>
          )
        ) : null}
      </section>

      <section className={`${ds.card} ${ds.cardPadding} space-y-4`} aria-labelledby="days-title">
        <div>
          <h2 id="days-title" className={ds.cardTitle}>
            Other fasting days
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            These days switch to suhoor and iftar too. Normal days stay normal.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {WEEKDAYS.map(({ index, label }) => {
            const on = s.weeklyDays.includes(index);
            return (
              <button
                key={index}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  update({ weeklyDays: on ? s.weeklyDays.filter((d) => d !== index) : [...s.weeklyDays, index].sort() })
                }
                className={`min-h-11 rounded-2xl border-2 px-3 py-2 text-sm font-semibold ${
                  on
                    ? "border-[var(--brand-primary)] bg-[var(--surface-brand-subtle)] text-[var(--brand-primary)]"
                    : "border-[var(--border-subtle)] text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <ul className="space-y-2">
          {presets.map((p) => {
            const on = p.dates.length > 0 && p.dates.every((d) => s.extraDays.includes(d));
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  disabled={!p.dates.length}
                  onClick={() => toggleDates(p.dates, !on)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border-2 px-3 py-2 text-left ${
                    on ? "border-[var(--brand-primary)] bg-[var(--surface-brand-subtle)]" : "border-[var(--border-subtle)]"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">{p.label}</span>
                    <span className="block text-xs text-[var(--text-muted)]">
                      {p.detail}
                      {p.dates.length
                        ? `: ${formatShortDate(p.dates[0]!)}${p.dates.length > 1 ? ` to ${formatShortDate(p.dates[p.dates.length - 1]!)}` : ""}`
                        : ""}
                    </span>
                  </span>
                  <span className="text-xs font-bold text-[var(--brand-primary)]">{on ? "Added" : "Add"}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-end gap-2">
          <label className="flex-1 text-xs font-medium text-[var(--text-secondary)]">
            Add a day
            <input type="date" min={todayISO} className={`${ds.input} mt-1 w-full`} value={newDay} onChange={(e) => setNewDay(e.target.value)} />
          </label>
          <button
            type="button"
            disabled={!isIsoDate(newDay)}
            onClick={() => {
              toggleDates([newDay], true);
              setNewDay("");
            }}
            className={`${ds.secondaryBtn} min-h-10 px-4 py-2 text-sm`}
          >
            Add
          </button>
        </div>
        {s.extraDays.filter((d) => d >= todayISO).length ? (
          <ul className="flex flex-wrap gap-2" aria-label="Single fasting days">
            {s.extraDays
              .filter((d) => d >= todayISO)
              .map((d) => (
                <li key={d}>
                  <button
                    type="button"
                    onClick={() => toggleDates([d], false)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-primary)]"
                    aria-label={`Remove ${formatShortDate(d)}`}
                  >
                    {formatShortDate(d)}
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </li>
              ))}
          </ul>
        ) : null}
      </section>

      <section className={`${ds.card} ${ds.cardPadding} space-y-3`} aria-labelledby="reminders-title">
        <div>
          <h2 id="reminders-title" className={ds.cardTitle}>
            Reminders
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {native ? "On this iPhone, on fasting days." : "These go off in the BiteSync iPhone app."}
          </p>
        </div>
        {(
          [
            ["suhoorReminder", "Suhoor", `${SUHOOR_REMINDER_MINUTES} minutes before Fajr`],
            ["iftarPlanReminder", "Plan tomorrow's iftar", "At midday, the day before"],
          ] as const
        ).map(([key, label, detail]) => (
          <label key={key} className="flex min-h-11 items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span>
              <span className="block text-xs text-[var(--text-muted)]">{detail}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="h-5 w-5 shrink-0 accent-[var(--brand-primary)]"
              checked={s[key]}
              onChange={(e) => update({ [key]: e.target.checked })}
            />
          </label>
        ))}
        {s.suhoorReminder && !s.place ? (
          <p className="text-xs text-[var(--text-muted)]">Pick your city above so BiteSync knows when Fajr is.</p>
        ) : null}
      </section>

      <button type="button" onClick={save} disabled={isPending} className={`${ds.primaryBtn} w-full`}>
        {isPending ? "Saving…" : "Save fasting settings"}
      </button>
      <button
        type="button"
        onClick={() => {
          setTicked([]);
          setAskingAgain(true);
        }}
        className="block w-full py-2 text-center text-xs font-medium text-[var(--text-muted)] underline-offset-2 hover:underline"
      >
        Answer the health question again
      </button>
    </div>
  );
}
