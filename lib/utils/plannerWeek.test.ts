import assert from "node:assert/strict";
import { addDays, plannerWeekStart, toLocalISO } from "./dates";

// The planner page runs on the server (UTC) and the arrows run in the browser.
// Build the week on "the server", then read it back as each browser would.
// Node applies a TZ change at runtime.
const zones = ["Europe/London", "America/New_York", "America/Los_Angeles", "Pacific/Honolulu", "Asia/Kolkata", "Australia/Sydney"];

for (const zone of zones) {
  process.env.TZ = "UTC";
  const week = plannerWeekStart("2026-10-21"); // a Wednesday: snaps to Monday 19th
  process.env.TZ = zone;
  assert.equal(toLocalISO(week), "2026-10-19", `${zone}: shows the right Monday`);
  assert.equal(toLocalISO(addDays(week, 7)), "2026-10-26", `${zone}: next week`);
  assert.equal(toLocalISO(addDays(week, -7)), "2026-10-12", `${zone}: previous week`);
  assert.equal(toLocalISO(addDays(week, 6)), "2026-10-25", `${zone}: Sunday's date`);
}

// No week in the URL, or a malformed one: the week containing today.
process.env.TZ = "UTC";
assert.equal(toLocalISO(plannerWeekStart(undefined, new Date("2026-10-18T13:00:00Z"))), "2026-10-12");
assert.equal(toLocalISO(plannerWeekStart("not-a-date", new Date("2026-10-18T13:00:00Z"))), "2026-10-12");

console.log("plannerWeek tests passed");
