import Link from "next/link";
import { Utensils } from "lucide-react";

type Props = {
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
};

export function Logo({ size = "md", href = "/planner", className }: Props) {
  const sizes = {
    sm: { icon: "h-4 w-4", text: "text-sm", gap: "gap-1.5", box: "h-6 w-6" },
    md: { icon: "h-5 w-5", text: "text-base", gap: "gap-2", box: "h-8 w-8" },
    lg: { icon: "h-7 w-7", text: "text-2xl", gap: "gap-2.5", box: "h-10 w-10" },
  } as const;

  const s = sizes[size];
  const classes = `inline-flex items-center ${s.gap} ${className ?? ""}`.trim();

  const content = (
    <>
      <span className={`flex flex-shrink-0 items-center justify-center rounded-lg bg-[#1A4731] ${s.box}`}>
        <Utensils className={`${s.icon} text-white`} aria-hidden="true" />
      </span>
      <span className={`font-semibold tracking-tight ${s.text}`}>
        <span className="text-slate-800 dark:text-gray-100">Bite</span>
        <span className="text-[#1A4731] dark:text-emerald-400">Sync</span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <span className={classes}>{content}</span>;
}
