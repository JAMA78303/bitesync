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
      <h2 className="mb-6 text-center text-xs font-semibold tracking-wider text-[var(--text-link)] uppercase">
        From people using it
      </h2>
      {/* flex-wrap + max-w so one quote sits centred and three sit in a row,
          without a grid that leaves gaps at in-between counts. */}
      <ul className="flex flex-wrap justify-center gap-6">
        {TESTIMONIALS.map((t) => (
          <li key={t.name + t.quote.slice(0, 24)} className="w-full max-w-2xl">
            <figure className="h-full text-center">
              <Quote className="mx-auto mb-4 h-7 w-7 text-[var(--brand-primary)] opacity-60" aria-hidden />
              <blockquote className="text-lg leading-relaxed font-medium text-balance text-[var(--text-primary)] sm:text-2xl sm:leading-snug">
                {t.quote}
              </blockquote>
              <figcaption className="mt-5 text-sm font-semibold text-[var(--text-secondary)]">
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
