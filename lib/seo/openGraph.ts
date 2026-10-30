/**
 * The site's share image, for pages that set their own openGraph. Next.js
 * replaces the root openGraph (and twitter) rather than merging, so a page that
 * sets one and leaves out images shares with no picture.
 */
export function ogImages(alt: string) {
  return [{ url: "/opengraph-image", width: 1200, height: 630, alt }];
}
