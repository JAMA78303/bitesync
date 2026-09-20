import { Quote } from "lucide-react";

type Testimonial = {
  quote: string;
  name: string;
  /** Optional, only what the person is happy to share — "marathon runner", "works nights". */
  context?: string;
};

/**
 * Real quotes from real users, added by hand as they arrive with the person's
 * permission. Spelling and punctuation tidied; wording left as said.
 *
 * Never seed this with placeholders. An invented testimonial is the one thing
 * on this page that would make every other claim on it worthless.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I've been using BiteSync and it's been a game changer. I've already been on a weight loss journey and this has helped me stay on top of it.",
    name: "Joe",
  },
];

export function LandingTestimonials() {
  if (!TESTIMONIALS.length) return null;

  return (
    <div className="mx-auto max-w-6xl px-4">
      <h2 className="mb-8 text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
        From people using it
      </h2>
      {/* flex-wrap + max-w so one quote sits centred and three sit in a row,
          without a grid that leaves gaps at in-between counts. */}
      <ul className="flex flex-wrap justify-center gap-6">
        {TESTIMONIALS.map((t) => (
          <li key={t.name + t.quote.slice(0, 24)} className="w-full max-w-xl">
            <figure className="h-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8">
              <Quote className="mb-4 h-6 w-6 text-[var(--brand-primary)]" aria-hidden />
              <blockquote className="text-base leading-relaxed text-[var(--text-primary)] sm:text-lg">
                {t.quote}
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-[var(--text-secondary)]">
                — {t.name}
                {t.context ? (
                  <span className="font-normal text-[var(--text-muted)]">, {t.context}</span>
                ) : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
