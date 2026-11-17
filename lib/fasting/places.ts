import type { CalculationMethodId } from "@/lib/fasting/prayerTimes";

/**
 * Cities to pick for prayer times, so no location lookup service is needed.
 * Each carries the method most of its mosques use as a starting point; the
 * person can change the method and the minutes offset to match their own.
 */
export type Place = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  method: CalculationMethodId;
};

const p = (
  name: string,
  country: string,
  latitude: number,
  longitude: number,
  timeZone: string,
  method: CalculationMethodId = "mwl",
): Place => ({ name, country, latitude, longitude, timeZone, method });

export const PLACES: Place[] = [
  // United Kingdom and Ireland
  p("London", "United Kingdom", 51.5074, -0.1278, "Europe/London"),
  p("Birmingham", "United Kingdom", 52.4862, -1.8904, "Europe/London"),
  p("Manchester", "United Kingdom", 53.4808, -2.2426, "Europe/London"),
  p("Bradford", "United Kingdom", 53.795, -1.7594, "Europe/London"),
  p("Leeds", "United Kingdom", 53.8008, -1.5491, "Europe/London"),
  p("Leicester", "United Kingdom", 52.6369, -1.1398, "Europe/London"),
  p("Glasgow", "United Kingdom", 55.8642, -4.2518, "Europe/London"),
  p("Edinburgh", "United Kingdom", 55.9533, -3.1883, "Europe/London"),
  p("Cardiff", "United Kingdom", 51.4816, -3.1791, "Europe/London"),
  p("Dublin", "Ireland", 53.3498, -6.2603, "Europe/Dublin"),
  // Europe
  p("Paris", "France", 48.8566, 2.3522, "Europe/Paris"),
  p("Berlin", "Germany", 52.52, 13.405, "Europe/Berlin"),
  p("Amsterdam", "Netherlands", 52.3676, 4.9041, "Europe/Amsterdam"),
  p("Brussels", "Belgium", 50.8503, 4.3517, "Europe/Brussels"),
  p("Copenhagen", "Denmark", 55.6761, 12.5683, "Europe/Copenhagen"),
  p("Stockholm", "Sweden", 59.3293, 18.0686, "Europe/Stockholm"),
  p("Oslo", "Norway", 59.9139, 10.7522, "Europe/Oslo"),
  p("Vienna", "Austria", 48.2082, 16.3738, "Europe/Vienna"),
  p("Madrid", "Spain", 40.4168, -3.7038, "Europe/Madrid"),
  p("Rome", "Italy", 41.9028, 12.4964, "Europe/Rome"),
  p("Sarajevo", "Bosnia and Herzegovina", 43.8563, 18.4131, "Europe/Sarajevo"),
  p("Istanbul", "Türkiye", 41.0082, 28.9784, "Europe/Istanbul"),
  // Middle East
  p("Makkah", "Saudi Arabia", 21.4225, 39.8262, "Asia/Riyadh", "ummAlQura"),
  p("Madinah", "Saudi Arabia", 24.4672, 39.6111, "Asia/Riyadh", "ummAlQura"),
  p("Riyadh", "Saudi Arabia", 24.7136, 46.6753, "Asia/Riyadh", "ummAlQura"),
  p("Jeddah", "Saudi Arabia", 21.4858, 39.1925, "Asia/Riyadh", "ummAlQura"),
  p("Dubai", "United Arab Emirates", 25.2048, 55.2708, "Asia/Dubai", "dubai"),
  p("Abu Dhabi", "United Arab Emirates", 24.4539, 54.3773, "Asia/Dubai", "dubai"),
  p("Doha", "Qatar", 25.2854, 51.531, "Asia/Qatar", "ummAlQura"),
  p("Kuwait City", "Kuwait", 29.3759, 47.9774, "Asia/Kuwait"),
  p("Manama", "Bahrain", 26.2285, 50.586, "Asia/Bahrain", "ummAlQura"),
  p("Muscat", "Oman", 23.588, 58.3829, "Asia/Muscat"),
  p("Amman", "Jordan", 31.9454, 35.9284, "Asia/Amman"),
  p("Beirut", "Lebanon", 33.8938, 35.5018, "Asia/Beirut"),
  p("Jerusalem", "Palestine", 31.7683, 35.2137, "Asia/Jerusalem"),
  p("Baghdad", "Iraq", 33.3152, 44.3661, "Asia/Baghdad"),
  p("Tehran", "Iran", 35.6892, 51.389, "Asia/Tehran", "tehran"),
  // Africa
  p("Cairo", "Egypt", 30.0444, 31.2357, "Africa/Cairo", "egypt"),
  p("Khartoum", "Sudan", 15.5007, 32.5599, "Africa/Khartoum", "egypt"),
  p("Casablanca", "Morocco", 33.5731, -7.5898, "Africa/Casablanca"),
  p("Algiers", "Algeria", 36.7538, 3.0588, "Africa/Algiers"),
  p("Tunis", "Tunisia", 36.8065, 10.1815, "Africa/Tunis"),
  p("Dakar", "Senegal", 14.7167, -17.4677, "Africa/Dakar"),
  p("Lagos", "Nigeria", 6.5244, 3.3792, "Africa/Lagos"),
  p("Kano", "Nigeria", 12.0022, 8.592, "Africa/Lagos"),
  p("Mogadishu", "Somalia", 2.0469, 45.3182, "Africa/Mogadishu"),
  p("Nairobi", "Kenya", -1.2921, 36.8219, "Africa/Nairobi"),
  p("Johannesburg", "South Africa", -26.2041, 28.0473, "Africa/Johannesburg"),
  p("Cape Town", "South Africa", -33.9249, 18.4241, "Africa/Johannesburg"),
  // South and Southeast Asia
  p("Karachi", "Pakistan", 24.8607, 67.0011, "Asia/Karachi", "karachi"),
  p("Lahore", "Pakistan", 31.5204, 74.3587, "Asia/Karachi", "karachi"),
  p("Islamabad", "Pakistan", 33.6844, 73.0479, "Asia/Karachi", "karachi"),
  p("Delhi", "India", 28.6139, 77.209, "Asia/Kolkata", "karachi"),
  p("Mumbai", "India", 19.076, 72.8777, "Asia/Kolkata", "karachi"),
  p("Hyderabad", "India", 17.385, 78.4867, "Asia/Kolkata", "karachi"),
  p("Dhaka", "Bangladesh", 23.8103, 90.4125, "Asia/Dhaka", "karachi"),
  p("Kuala Lumpur", "Malaysia", 3.139, 101.6869, "Asia/Kuala_Lumpur", "jakim"),
  p("Singapore", "Singapore", 1.3521, 103.8198, "Asia/Singapore", "jakim"),
  p("Jakarta", "Indonesia", -6.2088, 106.8456, "Asia/Jakarta", "jakim"),
  // Americas
  p("New York", "United States", 40.7128, -74.006, "America/New_York", "isna"),
  p("Chicago", "United States", 41.8781, -87.6298, "America/Chicago", "isna"),
  p("Detroit", "United States", 42.3314, -83.0458, "America/Detroit", "isna"),
  p("Houston", "United States", 29.7604, -95.3698, "America/Chicago", "isna"),
  p("Los Angeles", "United States", 34.0522, -118.2437, "America/Los_Angeles", "isna"),
  p("Toronto", "Canada", 43.6532, -79.3832, "America/Toronto", "isna"),
  p("Montreal", "Canada", 45.5017, -73.5673, "America/Toronto", "isna"),
  p("Vancouver", "Canada", 49.2827, -123.1207, "America/Vancouver", "isna"),
  // Oceania
  p("Sydney", "Australia", -33.8688, 151.2093, "Australia/Sydney"),
  p("Melbourne", "Australia", -37.8136, 144.9631, "Australia/Melbourne"),
  p("Perth", "Australia", -31.9505, 115.8605, "Australia/Perth"),
  p("Auckland", "New Zealand", -36.8485, 174.7633, "Pacific/Auckland"),
];

/** Places whose name or country starts a word with the query, best first. */
export function searchPlaces(query: string, limit = 8): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const startsWord = (text: string) => text.toLowerCase().split(/[\s-]+/).some((w) => w.startsWith(q));
  const byName = PLACES.filter((pl) => pl.name.toLowerCase().startsWith(q));
  const rest = PLACES.filter((pl) => !byName.includes(pl) && (startsWord(pl.name) || startsWord(pl.country)));
  return [...byName, ...rest].slice(0, limit);
}
