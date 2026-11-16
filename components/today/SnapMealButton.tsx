"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { PhotoMealSheet } from "@/components/today/PhotoMealSheet";
import type { Person } from "@/lib/nutrition/drv";
import { ds } from "@/lib/ui/classes";

/** Today's "Snap a meal": logs something that wasn't on the plan, from a photo. */
export function SnapMealButton({ person, className = "" }: { person: Person; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${ds.secondaryBtn} min-h-10 gap-1.5 px-3.5 py-2 text-xs ${className}`}
      >
        <Camera className="h-3.5 w-3.5" aria-hidden />
        Snap a meal
      </button>
      {open ? <PhotoMealSheet person={person} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
