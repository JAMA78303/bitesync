import type { ReactNode } from "react";
import { ds } from "@/lib/ui/classes";

type Props = {
  header: ReactNode;
  children: ReactNode;
  /** Use false for pages without the overlapping card effect */
  overlap?: boolean;
  className?: string;
};

export function PageShell({ header, children, overlap = true, className = "" }: Props) {
  return (
    <div className={`-mx-4 ${ds.page} md:mx-0 ${className}`.trim()}>
      {header}
      <div className={`px-4 ${overlap ? ds.overlap : "pt-4"} ${ds.pageContent}`}>{children}</div>
    </div>
  );
}
