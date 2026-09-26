import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * One privacy line under the closing call to action — keep aligned with
 * app/privacy/page.tsx. This component used to have hero and full-section
 * variants too; with the hero line, the trust row and this, privacy was said
 * four times on one page. The hero now carries a single inline line and the
 * detail lives on /privacy and in the FAQ.
 */
export function LandingTrustSignals() {
  return (
    <p className="mt-5 text-xs text-[var(--text-on-brand-subtle)]">
      <Lock className="mr-1 inline h-3.5 w-3.5 opacity-90" aria-hidden />
      Private by default — no ads, data never sold.{" "}
      <Link href="/privacy" className="font-medium underline underline-offset-2 hover:text-[var(--text-on-brand)]">
        Privacy policy
      </Link>
    </p>
  );
}
