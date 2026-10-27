import { upcomingWeekStarts, weeklyReminderTimes } from "@/lib/native/reminderSchedule";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function local(iso: string, hour = 12, minute = 0): Date {
  const d = new Date(`${iso}T00:00:00`);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Wednesday 28 Oct 2026: the next four Mondays.
const wednesday = local("2026-10-28");
assert(
  upcomingWeekStarts(wednesday).join() === "2026-11-02,2026-11-09,2026-11-16,2026-11-23",
  "weeks start on the coming Monday",
);

// Sunday: tomorrow is the first week.
assert(upcomingWeekStarts(local("2026-11-01"))[0] === "2026-11-02", "on Sunday, tomorrow's week comes first");

// Each reminder is 16:00 on the Sunday before its week.
const times = weeklyReminderTimes(wednesday, ["2026-11-02", "2026-11-16"]);
assert(times.length === 2, "one reminder per empty week");
const first = times[0]!.at;
assert(first.getDay() === 0 && first.getDate() === 1 && first.getHours() === 16, "Sunday 1 Nov at 16:00");
assert(times[1]!.at.getDate() === 15, "Sunday 15 Nov for the week of 16 Nov");

// Sunday after 16:00: tomorrow's reminder has passed, so it's dropped rather than sent now.
const lateSunday = local("2026-11-01", 17, 30);
const late = weeklyReminderTimes(lateSunday, upcomingWeekStarts(lateSunday));
assert(late.length === 3 && late[0]!.weekStart === "2026-11-09", "a past reminder is skipped");

// Sunday before 16:00: today's reminder still goes.
const earlySunday = local("2026-11-01", 15, 59);
assert(weeklyReminderTimes(earlySunday, ["2026-11-02"]).length === 1, "today's 16:00 reminder is kept");

// Nothing empty, nothing scheduled.
assert(weeklyReminderTimes(wednesday, []).length === 0, "planned weeks get no reminder");

console.log("reminder schedule tests passed");
