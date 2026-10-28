import { isNativeAppUserAgent, NATIVE_APP_UA_MARKER } from "@/lib/native/app";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const safari =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1";
// WKWebView has no "Safari/" token; Capacitor appends appendUserAgent after a space.
const app = `Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ${NATIVE_APP_UA_MARKER}`;

assert(isNativeAppUserAgent(app), "the iPhone app is recognised");
assert(!isNativeAppUserAgent(safari), "Safari on iPhone is not the app");
assert(!isNativeAppUserAgent(null), "no user agent is not the app");
assert(!isNativeAppUserAgent(""), "an empty user agent is not the app");

console.log("native app tests passed");
