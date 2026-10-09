"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/components/landing/LandingFaq";

/**
 * Renders every item in FAQ_ITEMS — the same array the FAQPage structured
 * data is built from, so the two can't drift. Closed answers stay in the page
 * (collapsed, not removed), so crawlers and find-in-page still reach them.
 */
export function HomeFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div>
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="qa" data-open={isOpen}>
            <h3>
              <button
                type="button"
                id={`faq-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <span className="qa-icon" aria-hidden>
                  +
                </span>
              </button>
            </h3>
            <div className="answer" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
              <div>
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
