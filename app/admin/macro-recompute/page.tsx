import Link from "next/link";
import { MacroRecomputePanel } from "@/components/admin/MacroRecomputePanel";

export const maxDuration = 60;

export default function AdminMacroRecomputePage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Macro recompute</h1>
          <p className="mt-1 text-sm text-slate-500">
            Spec 4 — repair saved recipe ingredients and nutrition after parser / CoFID fixes.
          </p>
        </div>
        <Link href="/admin/nutrition" className="text-sm text-[#3a5a40] hover:underline">
          ← Nutrition overrides
        </Link>
      </div>

      <MacroRecomputePanel />
    </div>
  );
}
