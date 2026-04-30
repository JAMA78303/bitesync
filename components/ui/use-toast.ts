"use client";

type ToastArgs = { title: string; description?: string; variant?: "destructive" | "default" };

export function useToast() {
  return {
    toast: ({ title, description, variant }: ToastArgs) => {
      if (typeof window !== "undefined") {
        const prefix = variant === "destructive" ? "Error: " : "";
        window.alert(`${prefix}${title}${description ? `\n${description}` : ""}`);
      }
    },
  };
}
