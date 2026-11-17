import assert from "node:assert/strict";
import { fastingDaysPromptSection } from "@/lib/ai/client";
import { fastingModeVisible } from "@/lib/fasting/access";
import { getFastingSettings, isMissingTableError } from "@/lib/fasting/server";
import { expectedRamadan, hijriDate, isEidDay, presetDates, ramadanOfferOpen } from "@/lib/fasting/hijri";
import { formatClock, isoDateInZone, weekdayIndexISO, zonedDateTime } from "@/lib/fasting/isoDate";
import { searchPlaces } from "@/lib/fasting/places";
import { fastingTimes, type CalculationMethodId } from "@/lib/fasting/prayerTimes";
import { fastingReminderTimes } from "@/lib/fasting/reminderTimes";
import {
  daysSinceRamadanEnded,
  DEFAULT_FASTING_SETTINGS,
  fastingDayCalorieTarget,
  fastingDayIndexes,
  fastingSettingsFromRow,
  fastingSettingsToRow,
  isFastingDay,
  type FastingSettings,
} from "@/lib/fasting/settings";
import { isSuhoorFood, mealSlotLabel } from "@/lib/fasting/slots";
import { computeNutritionTargetsFromProfile } from "@/lib/utils/nutrition-targets";

// --- Hijri dates (Umm al-Qura, from Intl) ---------------------------------

assert.deepEqual(hijriDate("2027-02-08"), { year: 1448, month: 9, day: 1 }, "1 Ramadan 1448 is 8 Feb 2027");

const r1448 = expectedRamadan("2026-11-17")!;
assert.equal(r1448.start, "2027-02-08", "Ramadan 1448 starts 8 Feb 2027 (spec: ~8 Feb)");
assert.equal(r1448.end, "2027-03-08", "29 or 30 days: last fast 8 Mar");
assert.equal(r1448.eid, "2027-03-09");
assert.equal(r1448.hijriYear, 1448);

// Partway through Ramadan, it's this Ramadan, not next year's.
assert.equal(expectedRamadan("2027-02-20")!.start, "2027-02-08", "mid-Ramadan finds the current one");
// After Eid, the next one.
assert.equal(expectedRamadan("2027-03-10")!.start, "2028-01-28", "after Eid, next year's Ramadan");

// Offered from six weeks (42 days) before, until the last fast.
assert.equal(ramadanOfferOpen("2026-12-28", r1448), true, "42 days before: offered");
assert.equal(ramadanOfferOpen("2026-12-27", r1448), false, "43 days before: not yet");
assert.equal(ramadanOfferOpen("2027-03-08", r1448), true, "last day still offered");
assert.equal(ramadanOfferOpen("2027-03-09", r1448), false, "Eid: over");

assert.equal(isEidDay("2027-03-09"), true, "Eid al-Fitr");
assert.equal(isEidDay("2027-03-10"), false);
assert.deepEqual(presetDates("arafah", "2026-11-17"), ["2027-05-15"], "Arafah 1448: 9 Dhu al-Hijjah");
assert.equal(isEidDay("2027-05-16"), true, "Eid al-Adha");
assert.deepEqual(presetDates("ashura", "2026-11-17"), ["2027-06-15"], "Ashura 1449: 10 Muharram");
const shawwal = presetDates("shawwal", "2026-11-17");
assert.equal(shawwal.length, 6);
assert.equal(shawwal[0], "2027-03-10", "six days of Shawwal start the day after Eid");
assert.equal(shawwal[5], "2027-03-15");
assert.equal(presetDates("shawwal", "2027-03-12")[0], "2027-03-10", "inside the six days: this year's");

// --- Prayer times ---------------------------------------------------------
// Reference: api.aladhan.com timings (same coordinates, method and date),
// fetched 17 Nov 2026. Ours rounds Fajr down and Maghrib up, so allow 2 min.
const reference: [string, number, number, CalculationMethodId, string, string, string, string][] = [
  ["2027-02-08", 51.5074, -0.1278, "mwl", "Europe/London", "05:34", "07:28", "17:02"],
  ["2027-02-08", 51.5074, -0.1278, "ummAlQura", "Europe/London", "05:31", "07:28", "17:02"],
  ["2027-02-08", 51.5074, -0.1278, "isna", "Europe/London", "05:53", "07:28", "17:02"],
  ["2027-02-08", 51.5074, -0.1278, "egypt", "Europe/London", "05:25", "07:28", "17:02"],
  ["2027-02-08", 21.4225, 39.8262, "ummAlQura", "Asia/Riyadh", "05:38", "06:55", "18:15"],
  // London in June: the sun never gets 18° down, so the angle-based rule sets Fajr.
  ["2027-06-15", 51.5074, -0.1278, "mwl", "Europe/London", "02:30", "04:43", "21:19"],
  ["2027-02-08", 3.139, 101.6869, "mwl", "Asia/Kuala_Lumpur", "06:16", "07:27", "19:27"],
  ["2027-02-08", 40.7128, -74.006, "isna", "America/New_York", "05:42", "06:59", "17:22"],
  ["2027-02-08", -33.8688, 151.2093, "mwl", "Australia/Sydney", "04:51", "06:23", "19:55"],
  ["2027-03-08", 24.8607, 67.0011, "karachi", "Asia/Karachi", "05:33", "06:49", "18:37"],
];
const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
for (const [iso, lat, lng, method, tz, fajr, sunrise, maghrib] of reference) {
  const t = fastingTimes(iso, { latitude: lat, longitude: lng, method });
  assert.ok(t, `${tz} ${iso}: times computed`);
  for (const [label, got, want] of [
    ["Fajr", t.fajr, fajr],
    ["sunrise", t.sunrise, sunrise],
    ["Maghrib", t.maghrib, maghrib],
  ] as const) {
    const diff = minutes(formatClock(got, tz)) - minutes(want);
    assert.ok(Math.abs(diff) <= 2, `${tz} ${iso} ${method} ${label}: ${formatClock(got, tz)} vs ${want}`);
    assert.equal(isoDateInZone(got, tz), iso, `${tz} ${label} falls on ${iso} locally`);
  }
}

// Offsets move each time by whole minutes.
const base = fastingTimes("2027-02-08", { latitude: 51.5074, longitude: -0.1278, method: "mwl" })!;
const shifted = fastingTimes("2027-02-08", {
  latitude: 51.5074,
  longitude: -0.1278,
  method: "mwl",
  fajrOffsetMinutes: -5,
  maghribOffsetMinutes: 3,
})!;
assert.equal(shifted.fajr.getTime() - base.fajr.getTime(), -5 * 60_000, "Fajr offset");
assert.equal(shifted.maghrib.getTime() - base.maghrib.getTime(), 3 * 60_000, "Maghrib offset");

// Shia methods put Maghrib after sunset.
const jafari = fastingTimes("2027-02-08", { latitude: 51.5074, longitude: -0.1278, method: "jafari" })!;
assert.ok(jafari.maghrib.getTime() - base.maghrib.getTime() >= 15 * 60_000, "Jafari Maghrib is later than sunset");

// No sunrise at all: Tromsø in December.
assert.equal(fastingTimes("2026-12-21", { latitude: 69.6492, longitude: 18.9553, method: "mwl" }), null);

// --- Wall-clock times in a zone -------------------------------------------
assert.equal(zonedDateTime("2027-02-08", 12, 0, "Europe/London").toISOString(), "2027-02-08T12:00:00.000Z");
assert.equal(zonedDateTime("2027-06-15", 12, 0, "Europe/London").toISOString(), "2027-06-15T11:00:00.000Z", "BST");
assert.equal(zonedDateTime("2027-02-08", 12, 0, "Asia/Karachi").toISOString(), "2027-02-08T07:00:00.000Z");
assert.equal(weekdayIndexISO("2027-02-08"), 0, "8 Feb 2027 is a Monday");

// --- Settings -------------------------------------------------------------
const london: FastingSettings = {
  ...DEFAULT_FASTING_SETTINGS,
  ramadanOn: true,
  place: { name: "London", latitude: 51.5074, longitude: -0.1278 },
  timeZone: "Europe/London",
};

assert.equal(isFastingDay(london, "2027-02-08"), true, "first day of expected Ramadan");
assert.equal(isFastingDay(london, "2027-03-08"), true, "last day");
assert.equal(isFastingDay(london, "2027-03-09"), false, "Eid");
assert.equal(isFastingDay(london, "2027-02-07"), false, "day before");
assert.equal(isFastingDay({ ...london, ramadanOn: false }, "2027-02-10"), false, "mode off");
// Their own moon-sighting dates win.
const sighted = { ...london, ramadanStart: "2027-02-09", ramadanEnd: "2027-03-10" };
assert.equal(isFastingDay(sighted, "2027-02-08"), false);
assert.equal(isFastingDay(sighted, "2027-03-10"), true);

// The week after Eid ("Back to normal meals?").
assert.equal(daysSinceRamadanEnded(london, "2027-03-08"), null, "last fast: not yet");
assert.equal(daysSinceRamadanEnded(london, "2027-03-09"), 1, "Eid");
assert.equal(daysSinceRamadanEnded(london, "2027-03-15"), 7);
assert.equal(daysSinceRamadanEnded(london, "2027-03-16"), null, "a week on: gone");
assert.equal(daysSinceRamadanEnded(sighted, "2027-03-11"), 1, "their own last day");
assert.equal(daysSinceRamadanEnded(london, "2027-01-10"), null, "before Ramadan");

// Monday and Thursday fasts, skipping Eid.
const mondaysThursdays = { ...DEFAULT_FASTING_SETTINGS, weeklyDays: [0, 3] };
assert.deepEqual(fastingDayIndexes(mondaysThursdays, "2026-11-16"), [0, 3]);
assert.equal(isFastingDay(mondaysThursdays, "2027-05-24"), true, "a Monday");
assert.equal(isFastingDay(mondaysThursdays, "2027-05-16"), false, "a Sunday");
assert.equal(isFastingDay(mondaysThursdays, "2027-05-17"), false, "a Monday in the days after Eid al-Adha");
assert.equal(isFastingDay({ ...mondaysThursdays, weeklyDays: [6] }, "2027-05-16"), false, "Eid al-Adha is skipped");
assert.equal(isFastingDay({ ...DEFAULT_FASTING_SETTINGS, extraDays: ["2027-05-15"] }, "2027-05-15"), true, "Arafah picked");
assert.deepEqual(fastingDayIndexes(london, "2027-02-08"), [0, 1, 2, 3, 4, 5, 6], "a whole Ramadan week");
assert.deepEqual(fastingDayIndexes(london, "2027-03-08"), [0], "Eid week: only Monday");
assert.deepEqual(fastingDayIndexes(null, "2027-02-08"), []);

// Round trip through a row, and junk dropped.
const row = fastingSettingsToRow({ ...london, extraDays: ["2027-05-15"], weeklyDays: [3, 0] }, "user-1");
const back = fastingSettingsFromRow(row as Record<string, unknown>)!;
assert.equal(back.ramadanOn, true);
assert.deepEqual(back.weeklyDays, [0, 3]);
assert.deepEqual(back.place, london.place);
const junk = fastingSettingsFromRow({
  extra_days: ["2027-02-30", "nope", "2027-05-15"],
  weekly_days: [9, 1],
  latitude: 200,
  longitude: 0,
  time_zone: "Mars/Olympus",
  method: "made-up",
  fajr_offset_minutes: 400,
  ramadan_start: "2027-03-01",
  ramadan_end: "2027-02-01",
})!;
assert.deepEqual(junk.extraDays, ["2027-05-15"]);
assert.deepEqual(junk.weeklyDays, [1]);
assert.equal(junk.place, null);
assert.equal(junk.timeZone, "Europe/London");
assert.equal(junk.method, "mwl");
assert.equal(junk.fajrOffsetMinutes, 30);
assert.equal(junk.ramadanStart, null, "start after end is dropped");
assert.equal(junk.suhoorReminder, true, "suhoor reminder defaults on");
assert.equal(fastingSettingsFromRow(null), null);

// --- Targets on a fasting day ---------------------------------------------
const losing = { weight_kg: 80, height_cm: 175, age: 30, sex: "male", activity_level: "moderate", goal: "lose" };
const normal = computeNutritionTargetsFromProfile(losing)!;
const maintain = computeNutritionTargetsFromProfile({ ...losing, goal: "maintain" })!;
assert.equal(fastingDayCalorieTarget(losing, london, normal.kcal), normal.kcal, "normal deficit kept, never bigger");
assert.equal(
  fastingDayCalorieTarget(losing, { ...london, noDeficit: true }, normal.kcal),
  maintain.kcal,
  "safety screen ticked: no deficit",
);
assert.equal(
  fastingDayCalorieTarget({ ...losing, goal: "gain" }, { ...london, noDeficit: true }, 3000),
  3000,
  "no deficit to remove",
);

// --- Slots ----------------------------------------------------------------
assert.equal(mealSlotLabel("breakfast", true), "Suhoor");
assert.equal(mealSlotLabel("dinner", true), "Iftar");
assert.equal(mealSlotLabel("snack", true), "Late snack");
assert.equal(mealSlotLabel("breakfast", false), "Breakfast");
assert.equal(isSuhoorFood("Overnight oats"), true);
assert.equal(isSuhoorFood("Chicken curry", ["chicken", "chickpeas"]), true);
assert.equal(isSuhoorFood("Eggplant parmigiana"), false, "eggplant isn't eggs");
assert.equal(isSuhoorFood("Beef stir fry", ["beef", "noodles"]), false);

// --- Places ---------------------------------------------------------------
assert.equal(searchPlaces("lon")[0]?.name, "London");
assert.ok(searchPlaces("saudi").some((p) => p.name === "Makkah"), "search by country");
assert.equal(searchPlaces("").length, 0);

// --- Reminders: a rolling window inside iOS's 64-notification limit -------
const remindersOn = { ...london, iftarPlanReminder: true };
const before = new Date("2027-02-07T10:00:00Z");
const reminders = fastingReminderTimes(remindersOn, before);
const suhoor = reminders.filter((r) => r.kind === "suhoor");
const iftarPlan = reminders.filter((r) => r.kind === "iftarPlan");
assert.equal(suhoor.length, 13, "suhoor on each fasting day in the two weeks (8–20 Feb)");
assert.equal(suhoor[0]!.date, "2027-02-08");
const firstFajr = fastingTimes("2027-02-08", { latitude: 51.5074, longitude: -0.1278, method: "mwl" })!.fajr;
assert.equal(Date.parse(suhoor[0]!.at), firstFajr.getTime() - 45 * 60_000, "45 minutes before Fajr");
assert.ok(suhoor[0]!.body.includes(formatClock(firstFajr, "Europe/London")));
assert.equal(iftarPlan[0]!.date, "2027-02-08", "midday on the 7th, about the 8th");
assert.equal(iftarPlan[0]!.at, "2027-02-07T12:00:00.000Z");
assert.ok(reminders.length <= 28, "never more than two a day");
assert.ok(reminders.every((r) => Date.parse(r.at) > before.getTime()), "nothing in the past");

// Mid-morning: today's suhoor has gone, so it's not scheduled.
const midMorning = fastingReminderTimes(london, new Date("2027-02-10T09:00:00Z"));
assert.equal(midMorning[0]!.date, "2027-02-11");
assert.equal(fastingReminderTimes({ ...london, suhoorReminder: false }, before).length, 0, "both off");
assert.equal(fastingReminderTimes({ ...london, place: null }, before).length, 0, "no place, no Fajr");
assert.equal(fastingReminderTimes(null, before).length, 0);

// --- The AI planner's prompt ----------------------------------------------
assert.equal(fastingDaysPromptSection([]), "", "no fasting days, prompt unchanged");
assert.equal(fastingDaysPromptSection(undefined), "");
const section = fastingDaysPromptSection([0, 3]);
assert.ok(section.includes("days 0, 3") && section.includes('"lunch" must be null') && section.includes("SUHOOR"));

// --- Before the SQL runs ---------------------------------------------------
assert.equal(isMissingTableError({ code: "PGRST205", message: "Could not find the table 'public.fasting_settings'" }), true);
assert.equal(isMissingTableError({ code: "42P01", message: 'relation "public.fasting_settings" does not exist' }), true);
assert.equal(
  isMissingTableError({ code: "23514", message: 'violates check constraint "fasting_settings_ramadan_dates"' }),
  false,
  "a real save error isn't reported as 'not available yet'",
);

// --- Not released yet: admins only until FASTING_MODE=on -----------------

void (async () => {
  const saved = { mode: process.env.FASTING_MODE, admins: process.env.ADMIN_USER_ID };
  process.env.ADMIN_USER_ID = "admin-1, admin-2";
  delete process.env.FASTING_MODE;
  assert.equal(fastingModeVisible("admin-2"), true, "an admin sees Ramadan mode before release");
  assert.equal(fastingModeVisible("someone"), false, "nobody else does");
  assert.equal(fastingModeVisible(null), false, "nor a signed-out visitor");
  process.env.FASTING_MODE = "on";
  assert.equal(fastingModeVisible("someone"), true, "FASTING_MODE=on releases it to everyone");
  process.env.FASTING_MODE = "off";

  // Hidden means nobody's settings are read: Today, the planner, plan
  // generation and iPhone reminders all see "never set up".
  let queried = false;
  const spy = { from: () => { queried = true; throw new Error("should not query"); } };
  const hidden = await getFastingSettings(spy as never, "someone");
  assert.equal(hidden, null, "hidden: no settings");
  assert.equal(queried, false, "hidden: the table isn't even queried");

  if (saved.mode === undefined) delete process.env.FASTING_MODE; else process.env.FASTING_MODE = saved.mode;
  if (saved.admins === undefined) delete process.env.ADMIN_USER_ID; else process.env.ADMIN_USER_ID = saved.admins;
  console.log("fasting tests passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
