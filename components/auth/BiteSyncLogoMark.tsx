import Image from "next/image";

const ICON_WIDTH = 448;
const ICON_HEIGHT = 456;

export function BiteSyncLogoMark({ className ="h-8 w-8" }: { className?: string }) {
 return (
 <Image
 src="/bitesync-icon-sm.png"
 alt=""
 width={ICON_WIDTH}
 height={ICON_HEIGHT}
 className={`object-contain ${className}`}
 aria-hidden
 priority
 unoptimized
 />
 );
}
