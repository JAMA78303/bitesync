"use client";

import { useState } from "react";
import type { PlannerChangeSnapshot } from "@/lib/recipes/macroRecompute";

type BatchResponse = {
  summary?: string;
  hasMore?: boolean;
  nextOffset?: number;
  significantSnapshots?: PlannerChangeSnapshot[];
  error?: string;
};

export function MacroRecomputePanel() {
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function runAllBatches(dryRun: boolean) {
    setError(null);
    setSummary(null);
    setPending(true);

    const parts: string[] = [];
    let offset = 0;
    let plannerSnapshots: PlannerChangeSnapshot[] = [];
    let batchIndex = 0;

    try {
      while (true) {
        batchIndex += 1;
        setProgress(`Processing batch ${batchIndex}…`);

        const res = await fetch("/api/admin/macro-recompute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dryRun, offset, plannerSnapshots }),
        });

        const data = (await res.json()) as BatchResponse;

        if (!res.ok || data.error) {
          throw new Error(data.error ?? `Request failed (${res.status})`);
        }

        if (data.summary) parts.push(data.summary);
        plannerSnapshots = [
          ...plannerSnapshots,
          ...(data.significantSnapshots ?? []),
        ];

        setSummary(parts.join("\n\n---\n\n"));

        if (!data.hasMore) break;
        offset = data.nextOffset ?? offset + 15;
      }

      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setProgress(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">One-off migration</p>
        <p className="mt-1 text-amber-900/80">
          Re-parses mangled ingredients and recomputes nutrition for all recipes. Runs in small
          batches so it does not time out on Vercel.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => runAllBatches(true)}
          className="rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Running…" : "1. Dry run"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => runAllBatches(false)}
          className="rounded-lg bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2d4a33] disabled:opacity-50"
        >
          {pending ? "Applying…" : "2. Apply recompute"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => runAllBatches(true)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          3. Verify (dry-run again)
        </button>
      </div>

      {progress ? (
        <p className="text-sm text-slate-600">{progress}</p>
      ) : null}

      {error ? (
        <pre className="overflow-x-auto rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </pre>
      ) : null}

      {summary ? (
        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs leading-relaxed whitespace-pre-wrap text-green-100">
          {summary}
        </pre>
      ) : null}
    </div>
  );
}
