import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex w-full items-center justify-between">
        <Logo size="lg" href="/" />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#1A4731] px-4 text-sm font-medium text-white transition hover:bg-[#153928]"
          >
            Get started free
          </Link>
        </div>
      </div>
      <p className="rounded-full bg-[var(--brand-sage)]/10 px-4 py-1 text-sm font-medium text-[var(--brand-sage)]">
        Weekly meal planning made simple
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
        Plan your week, cook with confidence, shop once.
      </h1>
      <p className="max-w-2xl text-lg text-gray-600">
        Build recipes, map meals across the week, and auto-generate one clean grocery list.
      </p>
    </main>
  );
}
