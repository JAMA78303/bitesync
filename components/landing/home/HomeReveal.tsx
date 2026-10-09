"use client";

import { useEffect } from "react";

/**
 * Fades sections in as they scroll into view. Content is only hidden once
 * this has run (data-reveal="armed"), so without JavaScript — or for people
 * who prefer reduced motion — everything is simply visible.
 *
 * Also watches for sections added after load: a client component that
 * re-mounts (on a code reload in development, for one) replaces its element,
 * and a section only observed at load would stay hidden for good.
 */
export function HomeReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lp");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );
    const watch = (scope: ParentNode) =>
      scope.querySelectorAll(".lp-reveal:not(.is-in)").forEach((el) => io.observe(el));

    watch(root);
    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(".lp-reveal:not(.is-in)")) io.observe(node);
          watch(node);
        });
      }
    });
    mo.observe(root, { childList: true, subtree: true });
    root.dataset.reveal = "armed";

    return () => {
      mo.disconnect();
      io.disconnect();
      delete root.dataset.reveal;
    };
  }, []);

  return null;
}
