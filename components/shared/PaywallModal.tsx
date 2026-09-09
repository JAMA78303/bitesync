"use client";

import { useTransition } from "react";
import { Lock, Loader2, Zap } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/stripe/actions";
import { PRO_MONTHLY_PRICE } from "@/lib/stripe/pricing";

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

 <h2 className="mb-2 text-base font-semibold text-[var(--text-primary)]">
 Upgrade to BiteSync Pro
 </h2>

 <p className="mb-6 text-sm text-[var(--text-muted)]">
 {reason} Upgrade to Pro for unlimited access.
 </p>

 <div className="flex flex-col gap-2">
 <Button
 onClick={handleUpgrade}
 disabled={isPending}
 className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
 >
 {isPending ? (
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 ) : (
 <Zap className="mr-2 h-4 w-4" />
 )}
 {isPending ?"Redirecting..." : `Upgrade to Pro - ${PRO_MONTHLY_PRICE}/mo`}
 </Button>

 <Button variant="ghost" onClick={onClose} className="w-full text-[var(--text-muted)]">
 Maybe later
 </Button>
 </div>

 <p className="mt-3 text-xs text-[var(--text-on-brand-muted)]">
 Cancel anytime - Secure payment by Stripe
 </p>
 </div>
 </DialogContent>
 </Dialog>
 );
}
