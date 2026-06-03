"use client";

import { useState, useTransition } from "react";
import { runMacroRecomputeAdmin } from "@/app/admin/macro-recompute/actions";

export function MacroRecomputePanel() {
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<"dry" | "apply" | null>(null);

  function run(dryRun: boolean) {
    setError(null);
    setLastMode(dryRun ? "dry" : "apply");
    startTransition(async () => {
      const result = await runMacroRecomputeAdmin(dryRun);
      if ("error" in result) {
        setError(result.error);
        setSummary(null);
        return;
      }
      setSummary(result.summary);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">One-off migration</p>
        <p className="mt-1 text-amber-900/80">
          Re-parses mangled ingredients and recomputes nutrition for all recipes using the
          corrected parser + CoFID matcher. Run dry-run first, review outliers, then apply.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(true)}
          className="rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending && lastMode === "dry" ? "Running dry-run…" : "1. Dry run"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(false)}
          className="rounded-lg bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2d4a33] disabled:opacity-50"
        >
          {pending && lastMode === "apply" ? "Applying…" : "2. Apply recompute"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(true)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          3. Verify (dry-run again)
        </button>
      </div>

      {error ? (
        <pre className="overflow-x-auto rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </pre>
      ) : null}

      {summary ? (
        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs leading-relaxed text-green-100 whitespace-pre-wrap">
          {summary}
        </pre>
      ) : null}
    </div>
  );
}
