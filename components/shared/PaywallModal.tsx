"use client";

import { useTransition } from "react";
import { Lock, Loader2, Zap } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/stripe/actions";

type Props = {
  open: boolean;
  onClose: () => void;
  reason: string;
};

export function PaywallModal({ open, onClose, reason }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleUpgrade() {
    startTransition(async () => {
      await createCheckoutSession(
        process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!,
        "monthly",
      );
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <div className="p-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>

          <h2 className="mb-2 text-base font-semibold text-slate-800">
            Upgrade to BiteSync Pro
          </h2>

          <p className="mb-6 text-sm text-slate-500">
            {reason} Upgrade to Pro for unlimited access.
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleUpgrade}
              disabled={isPending}
              className="w-full bg-[#1A4731] text-white hover:bg-[#153928]"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              {isPending ? "Redirecting..." : "Upgrade to Pro - £6.99/mo"}
            </Button>

            <Button variant="ghost" onClick={onClose} className="w-full text-slate-400">
              Maybe later
            </Button>
          </div>

          <p className="mt-3 text-xs text-slate-300">
            Cancel anytime - Secure payment by Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
