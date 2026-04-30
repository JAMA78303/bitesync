"use client";

import { useFormStatus } from "react-dom";

type AuthSubmitButtonProps = {
  label: string;
};

export function AuthSubmitButton({ label }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-md bg-[var(--brand-sage)] px-4 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Please wait..." : label}
    </button>
  );
}
