"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImageIcon, Loader2, Plus, X } from "lucide-react";
import { savePhotoMeal } from "@/app/(app)/today/photo-actions";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { sendAppEvent } from "@/lib/analytics/events";
import type { Person } from "@/lib/nutrition/drv";
import { formatRange, mealRange, microSummary, startingGrams } from "@/lib/photoMeal/totals";
import { resizePhoto } from "@/lib/photoMeal/resizeImage";
import type { FoodMatch, PhotoMealAnalysis, PhotoMealExtra, ReviewItem } from "@/lib/photoMeal/types";
import { ds } from "@/lib/ui/classes";
import { MEAL_LABELS, MEAL_TYPES, type MealType } from "@/types";

export type PhotoMealReplace = { entryId: string; mealType: MealType; mealName: string };

/** Mount it only while open (`{open ? <PhotoMealSheet … /> : null}`): every opening starts fresh. */
type Props = {
  onClose: () => void;
  person: Person;
  /** "Ate something else": the planned meal this photo replaces. */
  replace?: PhotoMealReplace | null;
};

type Step =
  | { kind: "pick" }
  | { kind: "analysing" }
  | { kind: "error"; message: string }
  | { kind: "review" };

type ExtraChoice = PhotoMealExtra & { included: boolean };

/** The meal people are most likely logging at this hour. */
export function mealTypeForNow(now = new Date()): MealType {
  const h = now.getHours() + now.getMinutes() / 60;
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h >= 17 && h < 22) return "dinner";
  return "snack";
}

function sliderMax(item: { gramsHigh: number; grams: number }): number {
  return Math.max(50, Math.ceil((Math.max(item.gramsHigh, item.grams) * 2) / 10) * 10);
}

/**
 * Snap a meal. Photo in, editable list of foods out, then one tap to add it
 * to today.
 *
 * Everything on the review screen is the user's to change: the AI's names and
 * weights are only a first draft. Totals show as a range until the portions
 * are set, so nobody mistakes a guess for a measurement.
 */
export function PhotoMealSheet({ onClose, person, replace = null }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [title, setTitle] = useState("");
  const [mealType, setMealType] = useState<MealType>(replace?.mealType ?? mealTypeForNow());
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [extras, setExtras] = useState<ExtraChoice[]>([]);
  const [adding, setAdding] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const editedRef = useRef(false);
  const savedRef = useRef(false);
  const startedAtRef = useRef(0);

  const reviewItems = useMemo(
    () => [
      ...items,
      ...extras
        .filter((e) => e.included)
        .map((e): ReviewItem => ({
          key: e.key,
          name: e.name,
          gramsLow: e.grams,
          gramsHigh: e.grams,
          grams: e.grams,
          edited: true,
          match: e.match,
        })),
    ],
    [items, extras],
  );
  const range = useMemo(() => mealRange(reviewItems), [reviewItems]);
  const micros = useMemo(() => microSummary(reviewItems, person), [reviewItems, person]);

  function close() {
    if (step.kind === "review" && !savedRef.current) {
      sendAppEvent("photo_log_abandoned", { items: items.length, edited: editedRef.current });
    }
    onClose();
  }

  function markEdited() {
    if (editedRef.current) return;
    editedRef.current = true;
    sendAppEvent("photo_log_edited", {});
  }

  async function analyse(file: File) {
    sendAppEvent("photo_log_started", { source: replace ? "replace" : "today" });
    startedAtRef.current = performance.now();
    setStep({ kind: "analysing" });

    let photo: { mediaType: "image/jpeg"; base64: string };
    try {
      photo = await resizePhoto(file);
    } catch {
      setStep({ kind: "error", message: "That photo couldn't be opened. Try a JPEG or PNG, or take a new one." });
      return;
    }

    let res: Response;
    try {
      res = await fetch("/api/photo-meal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType: photo.mediaType, image: photo.base64 }),
      });
    } catch {
      setStep({ kind: "error", message: "No connection. Check your signal and try again." });
      return;
    }
    const seconds = Math.round((performance.now() - startedAtRef.current) / 100) / 10;
    const body = (await res.json().catch(() => null)) as (PhotoMealAnalysis & { error?: string }) | null;
    if (!res.ok || !body || body.error) {
      sendAppEvent("photo_log_result", { outcome: `http_${res.status}`, seconds });
      setStep({ kind: "error", message: body?.error ?? "We couldn't read that photo just now. Try again in a moment." });
      return;
    }

    sendAppEvent("photo_log_result", {
      outcome: "ok",
      seconds,
      items: body.items.length,
      unmatched: body.items.filter((i) => !i.match).length,
    });
    setTitle(body.title);
    setItems(
      body.items.map((i) => ({
        key: i.key,
        name: i.name,
        gramsLow: i.gramsLow,
        gramsHigh: i.gramsHigh,
        grams: startingGrams(i.gramsLow, i.gramsHigh),
        edited: false,
        match: i.match,
      })),
    );
    setExtras(body.extras.map((e) => ({ ...e, included: false })));
    setStep({ kind: "review" });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void analyse(file);
  }

  async function lookUp(name: string): Promise<FoodMatch | null> {
    const res = await fetch("/api/photo-meal/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as { match: FoodMatch | null };
    return body.match;
  }

  async function rename(key: string, name: string) {
    const trimmed = name.trim();
    const current = items.find((i) => i.key === key);
    if (!current || trimmed.length < 2 || trimmed === current.name) return;
    markEdited();
    setBusyKey(key);
    try {
      const match = await lookUp(trimmed);
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, name: trimmed, match } : i)));
    } catch {
      toast({ title: "Couldn't look that up", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setBusyKey(null);
    }
  }

  async function addFood() {
    const name = adding.trim();
    if (name.length < 2) return;
    markEdited();
    setBusyKey("new");
    try {
      const match = await lookUp(name);
      setItems((prev) => [
        ...prev,
        { key: `u${Date.now()}`, name, gramsLow: 100, gramsHigh: 100, grams: 100, edited: true, match },
      ]);
      setAdding("");
    } catch {
      toast({ title: "Couldn't look that up", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setBusyKey(null);
    }
  }

  function save() {
    const lines = reviewItems.map((i) => ({ name: i.name, grams: Math.round(i.grams) }));
    if (!lines.length) return;
    startSaving(async () => {
      const result = await savePhotoMeal({
        title: title.trim() || "Meal from a photo",
        mealType,
        replaceEntryId: replace?.entryId ?? null,
        items: lines,
      });
      if ("error" in result) {
        toast({ title: "Couldn't add it", description: result.error, variant: "destructive" });
        return;
      }
      savedRef.current = true;
      toast({ title: "Added to today", description: `${title.trim() || "Your meal"} is on today's ${MEAL_LABELS[mealType].toLowerCase()}.` });
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(next) => (next ? null : close())}>
      <DialogContent className="max-w-md p-0">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
          <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
            {replace ? `Instead of ${replace.mealName}` : "Snap a meal"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-page)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        <input ref={libraryRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        {step.kind === "pick" ? (
          <div className="space-y-3 p-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Take a photo of your plate. We&apos;ll list the foods and portions, and you can change anything before
              it&apos;s added.
            </p>
            <button type="button" onClick={() => cameraRef.current?.click()} className={`${ds.primaryBtn} w-full gap-2`}>
              <Camera className="h-4 w-4" aria-hidden />
              Take a photo
            </button>
            <button type="button" onClick={() => libraryRef.current?.click()} className={`${ds.secondaryBtn} w-full gap-2`}>
              <ImageIcon className="h-4 w-4" aria-hidden />
              Choose a photo
            </button>
            <p className={ds.tierMeta}>Your photo isn&apos;t saved. It&apos;s used once for the estimate, then deleted.</p>
          </div>
        ) : null}

        {step.kind === "analysing" ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center" role="status" aria-live="polite">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-action)]" aria-hidden />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Looking at your meal…</p>
            <p className={ds.tierMeta}>This usually takes about 10 seconds.</p>
          </div>
        ) : null}

        {step.kind === "error" ? (
          <div className="space-y-3 p-4">
            <p className={`rounded-xl px-3 py-2.5 text-sm ${ds.errorCallout}`} role="alert">
              {step.message}
            </p>
            <button type="button" onClick={() => setStep({ kind: "pick" })} className={`${ds.primaryBtn} w-full`}>
              Try another photo
            </button>
          </div>
        ) : null}

        {step.kind === "review" ? (
          <div className="space-y-4 p-4">
            <p className={`rounded-lg px-3 py-2 text-xs font-medium ${ds.warnCallout}`}>
              Estimate: check the foods and portions before adding.
            </p>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <label className="flex min-w-0 flex-col gap-1">
                <span className={ds.formSectionLabel}>Meal name</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 60))}
                  className="h-10 rounded-xl border border-[var(--border-default)] bg-[var(--surface-input)] px-3 text-sm text-[var(--text-primary)]"
                />
              </label>
              {replace ? null : (
                <label className="flex flex-col gap-1">
                  <span className={ds.formSectionLabel}>Meal</span>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    className="h-10 rounded-xl border border-[var(--border-default)] bg-[var(--surface-input)] px-2 text-sm text-[var(--text-primary)]"
                  >
                    {MEAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {MEAL_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <ul className="space-y-3">
              {items.map((item) => (
                <FoodRow
                  // Renamed rows remount, so the box shows the saved name.
                  key={`${item.key}:${item.name}`}
                  item={item}
                  busy={busyKey === item.key}
                  onRename={(name) => void rename(item.key, name)}
                  onGrams={(grams) => {
                    markEdited();
                    setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, grams, edited: true } : i)));
                  }}
                  onRemove={() => {
                    markEdited();
                    setItems((prev) => prev.filter((i) => i.key !== item.key));
                  }}
                />
              ))}
            </ul>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void addFood();
              }}
              className="flex gap-2"
            >
              <label className="sr-only" htmlFor="photo-meal-add">
                Add a food
              </label>
              <input
                id="photo-meal-add"
                value={adding}
                onChange={(e) => setAdding(e.target.value.slice(0, 80))}
                placeholder="Add a missing food"
                className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--surface-input)] px-3 text-sm text-[var(--text-primary)]"
              />
              <button
                type="submit"
                disabled={adding.trim().length < 2 || busyKey === "new"}
                className={`${ds.secondaryBtn} h-10 gap-1 px-3 py-0 text-xs disabled:opacity-50`}
              >
                {busyKey === "new" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                Add
              </button>
            </form>

            {extras.length ? (
              <fieldset className="space-y-2">
                <legend className={`mb-1 ${ds.formSectionLabel}`}>Hard to see in a photo</legend>
                {extras.map((extra) => (
                  <div key={extra.key} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 text-sm text-[var(--text-primary)]">
                      {extra.name} <span className={ds.tierMeta}>· about {extra.grams} g</span>
                    </span>
                    <div className="flex shrink-0 overflow-hidden rounded-lg border border-[var(--border-default)] text-xs font-semibold">
                      {[true, false].map((value) => (
                        <button
                          key={String(value)}
                          type="button"
                          aria-pressed={extra.included === value}
                          onClick={() => {
                            markEdited();
                            setExtras((prev) => prev.map((x) => (x.key === extra.key ? { ...x, included: value } : x)));
                          }}
                          className={`min-h-9 px-3 ${
                            extra.included === value
                              ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {value ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </fieldset>
            ) : null}

            <div className="rounded-2xl border border-[var(--border-default)] p-3">
              <p className="font-display text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-[var(--text-primary)]">
                {formatRange(range.low.kcal, range.high.kcal, "kcal")}
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-xs tabular-nums text-[var(--text-secondary)]">
                {(["protein", "carbs", "fat", "fibre"] as const).map((k) => (
                  <span key={k} className="whitespace-nowrap">
                    {k[0]!.toUpperCase() + k.slice(1)} {formatRange(range.low[k], range.high[k], "g")}
                  </span>
                ))}
              </p>
              {range.matchedCount && range.low.kcal !== range.high.kcal ? (
                <p className={`mt-1 ${ds.tierMeta}`}>
                  We&apos;ll add {(Math.round(range.current.kcal / 10) * 10).toLocaleString("en-GB")} kcal, from the
                  portions as set.
                </p>
              ) : null}
              {range.unmatchedCount ? (
                <p className={`mt-1 ${ds.tierMeta}`}>
                  {range.unmatchedCount === 1 ? "1 food has" : `${range.unmatchedCount} foods have`} no nutrition match, so
                  the real total is higher. Try renaming it.
                </p>
              ) : null}

              {micros.contributions.length ? (
                <div className="mt-3 border-t border-[var(--border-subtle)] pt-3">
                  <p className={ds.formSectionLabel}>Towards today&apos;s vitamins and minerals</p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {micros.contributions.slice(0, 5).map((c) => (
                      <li
                        key={c.key}
                        className="rounded-full bg-[var(--surface-brand-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]"
                      >
                        {c.label} {Math.round(c.shareOfDay * 100)}%
                      </li>
                    ))}
                  </ul>
                  {micros.foodsWithData < micros.foodsMatched ? (
                    <p className={`mt-1.5 ${ds.tierMeta}`}>
                      From {micros.foodsWithData} of {micros.foodsMatched} foods; the rest have no vitamin data.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={save}
              disabled={saving || !reviewItems.length || busyKey !== null}
              className={`${ds.primaryBtn} w-full gap-2 disabled:opacity-60`}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {replace ? "Log this instead" : `Add to ${MEAL_LABELS[mealType].toLowerCase()}`}
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function FoodRow({
  item,
  busy,
  onRename,
  onGrams,
  onRemove,
}: {
  item: ReviewItem;
  busy: boolean;
  onRename: (name: string) => void;
  onGrams: (grams: number) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(item.name);
  const max = sliderMax(item);
  const kcal = item.match ? Math.round((item.match.per100.kcal * item.grams) / 100) : null;
  const inputId = `photo-food-${item.key}`;

  return (
    <li className="rounded-2xl border border-[var(--border-default)] p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="sr-only">
            Food name
          </label>
          <input
            id={inputId}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 80))}
            onBlur={() => onRename(name)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-default)] focus:border-[var(--brand-action)]"
          />
          <p className={`px-1 ${ds.tierMeta}`}>
            {busy ? "Looking up…" : item.match ? item.match.source : "No nutrition match. Rename it to try again."}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.name}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-page)]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-3 px-1">
        <input
          type="range"
          min={5}
          max={max}
          step={5}
          value={item.grams}
          onChange={(e) => onGrams(Number(e.target.value))}
          aria-label={`${item.name} portion in grams`}
          className="min-w-0 flex-1 accent-[var(--brand-action)]"
        />
        <span className="w-24 shrink-0 text-right text-xs tabular-nums text-[var(--text-secondary)]">
          {item.grams} g{kcal != null ? ` · ${kcal} kcal` : ""}
        </span>
      </div>
      {!item.edited && item.gramsLow !== item.gramsHigh ? (
        <p className={`mt-1 px-1 ${ds.tierMeta}`}>
          Looks like {item.gramsLow}–{item.gramsHigh} g. Move the slider to set it.
        </p>
      ) : null}
    </li>
  );
}
