import assert from "node:assert/strict";
import { ANY_META_APP, identifySocialReferral } from "./socialReferrals";

const cases: Array<[string | null, boolean, string | null]> = [
  // [Referer, has fbclid, expected app]
  ["https://m.facebook.com/", false, "Facebook"],
  ["https://l.facebook.com/l.php?u=x", false, "Facebook"],
  ["https://www.facebook.com/groups/123", true, "Facebook"],
  ["https://lm.facebook.com/", false, "Facebook"],
  ["https://l.instagram.com/", true, "Instagram"],
  ["https://www.instagram.com/", false, "Instagram"],
  ["https://www.messenger.com/", false, "Messenger"],
  ["https://www.threads.net/", false, "Threads"],
  // In-app browsers often send no Referer; fbclid still marks the tap.
  [null, true, ANY_META_APP],
  ["https://bitesync.io/blog", true, ANY_META_APP],
  // Not shared-link visits.
  ["https://chatgpt.com/", false, null],
  ["https://www.google.com/", false, null],
  ["https://bitesync.io/", false, null],
  ["https://notfacebook.com.example.org/", false, null],
  ["not a url", false, null],
  [null, false, null],
];

for (const [referer, fbclid, expected] of cases) {
  const hit = identifySocialReferral(referer, fbclid);
  assert.equal(hit?.bot ?? null, expected, `referer=${referer} fbclid=${fbclid}`);
  if (hit) assert.equal(hit.kind, "social");
}

console.log(`socialReferrals: ${cases.length} cases passed`);
