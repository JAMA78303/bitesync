import assert from "node:assert/strict";
import { installHelpFor, isIosDevice } from "../pwa/platform";
import { HABIT_CARD_SNOOZE_KEY, HABIT_CARD_SNOOZE_MS, isHabitCardSnoozed, snoozeHabitCard } from "./snooze";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

// Install help
assert.equal(installHelpFor({ userAgent: IPHONE, standalone: true, hasPrompt: false }), "installed");
assert.equal(installHelpFor({ userAgent: ANDROID, standalone: false, hasPrompt: true }), "prompt");
assert.equal(installHelpFor({ userAgent: IPHONE, standalone: false, hasPrompt: false }), "ios-steps");
assert.equal(installHelpFor({ userAgent: ANDROID, standalone: false, hasPrompt: false }), "android-steps");
assert.equal(installHelpFor({ userAgent: MAC, platform: "MacIntel", maxTouchPoints: 0, standalone: false, hasPrompt: false }), "none");
// iPadOS reports a Mac user agent; touch points mark it as iOS.
assert.equal(isIosDevice({ userAgent: MAC, platform: "MacIntel", maxTouchPoints: 5 }), true);
assert.equal(installHelpFor({ userAgent: MAC, platform: "MacIntel", maxTouchPoints: 5, standalone: false, hasPrompt: false }), "ios-steps");

// Snooze
const mem = new Map<string, string>();
const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
assert.equal(isHabitCardSnoozed(storage, 1_000), false, "not snoozed by default");
snoozeHabitCard(storage, 1_000);
assert.equal(mem.get(HABIT_CARD_SNOOZE_KEY), "1000");
assert.equal(isHabitCardSnoozed(storage, 1_000 + HABIT_CARD_SNOOZE_MS - 1), true, "snoozed within 3 weeks");
assert.equal(isHabitCardSnoozed(storage, 1_000 + HABIT_CARD_SNOOZE_MS), false, "asks again after 3 weeks");
mem.set(HABIT_CARD_SNOOZE_KEY, "garbage");
assert.equal(isHabitCardSnoozed(storage, 1_000), false, "corrupt value ignored");
const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
snoozeHabitCard(blocked);
assert.equal(isHabitCardSnoozed(blocked), false, "blocked storage is harmless");

console.log("habit tests passed");
