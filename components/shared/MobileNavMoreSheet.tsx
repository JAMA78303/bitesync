"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Package, Target, X } from "lucide-react";

const MORE_ITEMS = [
  { href: "/nutrition", label: "Nutrition", Icon: BarChart2 },
  { href: "/pantry", label: "Pantry", Icon: Package },
  { href: "/goals", label: "Goals", Icon: Target },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileNavMoreSheet({ open, onClose }: Props) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-gray-200 bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">More</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-2">
          {MORE_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#f0f7f0] text-[#3a5a40] dark:bg-[#1a2e1d] dark:text-[#a7d4a9]"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
