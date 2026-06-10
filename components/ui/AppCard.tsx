import type { ReactNode } from "react";
import { ds } from "@/lib/ui/classes";

type Props = {
 children: ReactNode;
 className?: string;
 padding?: boolean;
};

export function AppCard({ children, className ="", padding = true }: Props) {
 return (
 <div className={`${ds.card} ${padding ? ds.cardPadding :""} ${className}`.trim()}>{children}</div>
 );
}
