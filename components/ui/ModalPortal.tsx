"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalPortalProps = {
  children: ReactNode;
};

/** Renders modals on document.body so they sit above the bottom nav and escape parent stacking contexts. */
export function ModalPortal({ children }: ModalPortalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
