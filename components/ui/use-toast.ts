"use client";

import { useToastContext } from "@/components/ui/ToastProvider";

type ToastArgs = {
  title: string;
  description?: string;
  variant?: "destructive" | "default";
};

export function useToast() {
  const { toast } = useToastContext();
  return { toast };
}

export type { ToastArgs };
