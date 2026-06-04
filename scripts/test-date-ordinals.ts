import { formatDayWithOrdinal, formatWeekdayWithOrdinal, ordinalSuffix } from "@/lib/utils/dates";

function assertEqual(actual: string, expected: string, note: string) {
  if (actual !== expected) {
    throw new Error(`${note}: expected "${expected}", got "${actual}"`);
  }
}

assertEqual(ordinalSuffix(1), "st", "1st");
assertEqual(ordinalSuffix(2), "nd", "2nd");
assertEqual(ordinalSuffix(3), "rd", "3rd");
assertEqual(ordinalSuffix(4), "th", "4th");
assertEqual(ordinalSuffix(11), "th", "11th");
assertEqual(ordinalSuffix(12), "th", "12th");
assertEqual(ordinalSuffix(13), "th", "13th");
assertEqual(ordinalSuffix(21), "st", "21st");
assertEqual(ordinalSuffix(22), "nd", "22nd");
assertEqual(ordinalSuffix(23), "rd", "23rd");
assertEqual(ordinalSuffix(31), "st", "31st");

assertEqual(formatDayWithOrdinal(1), "1st", "format day 1");
assertEqual(formatDayWithOrdinal(22), "22nd", "format day 22");

const monday = new Date(2026, 5, 1);
assertEqual(formatWeekdayWithOrdinal(monday), "Monday 1st", "weekday long");
assertEqual(formatWeekdayWithOrdinal(monday, "short"), "Mon 1st", "weekday short");

console.log("OK: date ordinal formatting");
