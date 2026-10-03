import assert from "node:assert/strict";
import { firstRunWeeks, resolveUserToday } from "./firstWeeks";

const at = (iso: string) => new Date(`${iso}T12:00:00`);

// Monday–Wednesday: this week only, as before.
assert.deepEqual(firstRunWeeks(at("2026-09-28")), {
  thisWeekStart: "2026-09-28",
  nextWeekStart: null,
  remainingDays: [0, 1, 2, 3, 4, 5, 6],
  mainWeekStart: "2026-09-28",
});
assert.equal(firstRunWeeks(at("2026-09-30")).nextWeekStart, null); // Wednesday

// Thursday: next week becomes the main plan.
const thu = firstRunWeeks(at("2026-10-01"));
assert.equal(thu.nextWeekStart, "2026-10-05");
assert.equal(thu.mainWeekStart, "2026-10-05");
assert.deepEqual(thu.remainingDays, [3, 4, 5, 6]);

// The paying customer's day: Saturday 3 October → rest of this week + week of 5 October.
const sat = firstRunWeeks(at("2026-10-03"));
assert.equal(sat.thisWeekStart, "2026-09-28");
assert.equal(sat.mainWeekStart, "2026-10-05");
assert.deepEqual(sat.remainingDays, [5, 6]);

// Sunday is the last day of the week, not the first.
const sun = firstRunWeeks(at("2026-10-04"));
assert.equal(sun.thisWeekStart, "2026-09-28");
assert.equal(sun.mainWeekStart, "2026-10-05");
assert.deepEqual(sun.remainingDays, [6]);

// Across a month and year boundary.
assert.equal(firstRunWeeks(at("2026-12-31")).mainWeekStart, "2027-01-04");

// The browser's date wins when it is within a day of the server's…
const server = new Date("2026-10-05T01:30:00"); // Monday on the server
assert.equal(resolveUserToday("2026-10-04", server).getDay(), 0); // still Sunday for the user
// …and is ignored when malformed or implausible.
assert.equal(resolveUserToday("04/10/2026", server), server);
assert.equal(resolveUserToday("2026-12-25", server), server);
assert.equal(resolveUserToday(undefined, server), server);

console.log("firstWeeks tests passed");
