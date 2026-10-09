import Image from "next/image";
import Link from "next/link";

type Props = {
 size?:"sm" |"md" |"lg";
 variant?:"full" |"icon";
 href?: string;
 className?: string;
 /**
  * Always use the dark-background version — for surfaces that are dark in
  * both themes, like the app sidebar. Otherwise it follows the theme.
  */
 onDark?: boolean;
};

const LOCKUP_WIDTH = 1450;
const LOCKUP_HEIGHT = 456;
const ICON_WIDTH = 448;
const ICON_HEIGHT = 456;
/** public/bitesync-wordmark-dark.png: the logo's lettering, trimmed to the letters. */
const WORDMARK_ASPECT = 949 / 249;
// The "-sm" files are the same artwork made to 3x the largest size shown
// (the originals are 1450px wide and ~380 KB, which held up the page on
// phones). The originals stay as the source for scripts/write-brand-icons.mjs.

const LOCKUP_ASPECT = LOCKUP_WIDTH / LOCKUP_HEIGHT;

const heights = { sm: 28, md: 36, lg: 44 } as const;

const iconDisplay = {
  sm: 32,
  md: 36,
  lg: 44,
} as const;

/**
 * The original icon on a light rounded tile, like an app icon. The icon is
 * drawn at the same size as in the light-mode logo (`px` tall); the tile is
 * a little larger around it, so dark mode doesn't make the logo look smaller.
 */
function IconTile({ px, lazy }: { px: number; lazy: boolean }) {
 const iconH = px;
 const iconW = Math.round((iconH * ICON_WIDTH) / ICON_HEIGHT);
 const tile = Math.round(px * 1.18);
 return (
  <span
   className="grid shrink-0 place-items-center bg-[#fffdf8]"
   style={{ width: tile, height: tile, borderRadius: Math.round(tile * 0.24) }}
  >
   <Image
    src="/bitesync-icon-sm.png"
    alt=""
    aria-hidden
    width={iconW}
    height={iconH}
    style={{ width: iconW, height: iconH }}
    className="object-contain"
    loading={lazy ? "lazy" : undefined}
    priority={!lazy}
    unoptimized
   />
  </span>
 );
}

/**
 * The BiteSync logo, artwork unchanged. Its navy can't be seen on a dark
 * background, so in dark mode (and on always-dark surfaces) it shows as the
 * original icon on a light tile with the name beside it — the lettering is
 * the logo's own, with "Sync" drawn light so it reads on dark.
 */
export function Logo({ size ="md", variant ="full", href ="/planner", className, onDark = false }: Props) {
 const wrapperClass = ["inline-flex shrink-0 items-center", className ??""].filter(Boolean).join(" ").trim();
 // Dark-only images are lazy unless always shown: a hidden lazy image is never
 // downloaded, so light-mode visitors don't pay for them.
 const lazyDark = !onDark;
 const darkShow = onDark ? "inline-flex" : "hidden dark:inline-flex";

 let image: React.ReactNode;
 if (variant ==="icon") {
  const px = iconDisplay[size];
  image = (
   <>
    {onDark ? null : (
     <Image
      src="/bitesync-icon-sm.png"
      alt="BiteSync"
      width={px}
      height={px}
      className="object-contain dark:hidden"
      style={{ width: px, height: px }}
      priority
      unoptimized
     />
    )}
    <span className={darkShow} role="img" aria-label="BiteSync">
     <IconTile px={px} lazy={lazyDark} />
    </span>
   </>
  );
 } else {
  const h = heights[size];
  const lockupW = Math.round(h * LOCKUP_ASPECT);
  // The lettering is 0.55 of the full logo's height, as in the original.
  const wordH = Math.round(h * 0.55);
  const wordW = Math.round(wordH * WORDMARK_ASPECT);
  image = (
   <>
    {onDark ? null : (
     <Image
      src="/bitesync-logo-full-sm.png"
      alt="BiteSync"
      width={lockupW}
      height={h}
      className="max-w-full object-contain object-left dark:hidden"
      style={{ width: lockupW, height: h, maxWidth: "min(100%, 11rem)" }}
      priority
      unoptimized
     />
    )}
    <span className={`${darkShow} items-center`} style={{ gap: Math.round(h * 0.2) }}>
     <IconTile px={h} lazy={lazyDark} />
     <Image
      src="/bitesync-wordmark-dark-sm.png"
      alt="BiteSync"
      width={wordW}
      height={wordH}
      style={{ width: wordW, height: wordH }}
      className="object-contain"
      loading={lazyDark ? "lazy" : undefined}
      priority={!lazyDark}
      unoptimized
     />
    </span>
   </>
  );
 }

 if (href) {
 return (
 <Link href={href} className={wrapperClass}>
 {image}
 </Link>
 );
 }

 return <span className={wrapperClass}>{image}</span>;
}
