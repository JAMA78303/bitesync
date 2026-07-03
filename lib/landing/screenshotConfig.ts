/** Shared landing screenshot capture dimensions — keep in sync with capture-landing-screenshots.mjs */

/** Logical width for staging scenes (matches narrow phone). */
export const SCREENSHOT_DEVICE_WIDTH = 390;
export const SCREENSHOT_DEVICE_DPR = 2;

/** @deprecated Full-phone captures — use compact crop constants below. */
export const SCREENSHOT_INNER_WIDTH_PX = SCREENSHOT_DEVICE_WIDTH;

/** Compact hero-crop card (~16:10 landscape, max ~280px tall on mobile). */
export const SCREENSHOT_CROP_WIDTH = 360;
export const SCREENSHOT_CROP_HEIGHT = 260;
export const SCREENSHOT_CROP_MAX_HEIGHT_PX = 280;
