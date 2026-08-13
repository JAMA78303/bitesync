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

const LOCKUP_ASPECT = LOCKUP_WIDTH / LOCKUP_HEIGHT;

const lockupDisplay = {
  sm: { height: 28, width: Math.round(28 * LOCKUP_ASPECT) },
  md: { height: 36, width: Math.round(36 * LOCKUP_ASPECT) },
  lg: { height: 44, width: Math.round(44 * LOCKUP_ASPECT) },
} as const;

const iconDisplay = {
  sm: 32,
  md: 36,
  lg: 44,
} as const;

export function Logo({ size ="md", variant ="full", href ="/planner", className }: Props) {
 const wrapperClass = [
  "inline-flex shrink-0 items-center",
  variant === "full" ? "rounded-lg bg-[var(--logo-lockup-bg)] dark:px-2 dark:py-0.5" : "",
  className ?? "",
 ]
  .filter(Boolean)
  .join(" ")
  .trim();
 const lockup = lockupDisplay[size];
 const iconPx = iconDisplay[size];
 const image =
 variant ==="icon" ? (
 <Image
 src="/bitesync-icon.png"
 alt="BiteSync"
 width={iconPx}
 height={iconPx}
 className="object-contain"
 style={{ width: iconPx, height: iconPx }}
 priority
 unoptimized
 />
 ) : (
 <Image
 src="/bitesync-logo-full.png"
 alt="BiteSync"
 width={lockup.width}
 height={lockup.height}
 className="max-w-full object-contain object-left"
 style={{ width: lockup.width, height: lockup.height, maxWidth: "min(100%, 11rem)" }}
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
