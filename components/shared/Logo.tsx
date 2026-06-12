import Image from "next/image";
import Link from "next/link";

type Props = {
 size?:"sm" |"md" |"lg";
 variant?:"full" |"icon";
 href?: string;
 className?: string;
};

const LOCKUP_WIDTH = 1450;
const LOCKUP_HEIGHT = 456;
const ICON_WIDTH = 448;
const ICON_HEIGHT = 456;

const lockupHeights = {
 sm: "h-7",
 md: "h-9",
 lg: "h-11",
} as const;

const iconSizes = {
 sm: "h-8 w-8",
 md: "h-9 w-9",
 lg: "h-11 w-11",
} as const;

export function Logo({ size ="md", variant ="full", href ="/planner", className }: Props) {
 const wrapperClass = `inline-flex shrink-0 items-center ${className ?? ""}`.trim();
 const image =
 variant ==="icon" ? (
 <Image
 src="/bitesync-icon.png"
 alt="BiteSync"
 width={ICON_WIDTH}
 height={ICON_HEIGHT}
 className={`object-contain ${iconSizes[size]}`}
 priority
 unoptimized
 />
 ) : (
 <Image
 src="/bitesync-logo-full.png"
 alt="BiteSync"
 width={LOCKUP_WIDTH}
 height={LOCKUP_HEIGHT}
 className={`w-auto ${lockupHeights[size]}`}
 priority
 unoptimized
 />
 );

 if (href) {
 return (
 <Link href={href} className={wrapperClass}>
 {image}
 </Link>
 );
 }

 return <span className={wrapperClass}>{image}</span>;
}
