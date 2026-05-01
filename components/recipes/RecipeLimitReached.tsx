"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { PaywallModal } from "@/components/shared/PaywallModal";

type Props = { count: number };

export function RecipeLimitReached({ count }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <Lock className="h-7 w-7 text-amber-600" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-slate-800">Recipe limit reached</h2>
      <p className="mb-6 text-sm text-slate-500">
        You&apos;ve used {count} of 10 free recipes. Upgrade to Pro for unlimited recipes.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-block rounded-xl bg-[#1A4731] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#153928]"
      >
        Upgrade to Pro
      </button>
      <p className="mt-4 text-xs text-slate-300">
        Or archive unused recipes to free up space
      </p>

      <PaywallModal
        open={open}
        onClose={() => setOpen(false)}
        reason="You've reached the 10 recipe limit."
      />
    </div>
  );
}
