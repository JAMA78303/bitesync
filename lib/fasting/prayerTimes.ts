/**
 * Fajr (when suhoor ends) and Maghrib (iftar), worked out on the device or
 * server from the place's coordinates. No outside API and no library: the sun
 * position formulas are the standard low-precision ones (US Naval Observatory,
 * also used by PrayTimes.org), good to about a minute, which is why every
 * method also takes a minutes offset to line up with a local mosque.
 *
 * Only the two times Ramadan mode uses are computed. Asr (and so the Asr
 * school) and Isha are left out until something needs them.
 */

export type CalculationMethodId =
  | "mwl"
  | "ummAlQura"
  | "isna"
  | "egypt"
  | "karachi"
  | "dubai"
  | "jakim"
  | "tehran"
  | "jafari";

type MethodSpec = {
  label: string;
  /** Sun's angle below the horizon at Fajr, degrees. */
  fajrAngle: number;
  /** Shia methods put Maghrib after sunset, at this angle; others use sunset. */
  maghribAngle?: number;
};

export const CALCULATION_METHODS: Record<CalculationMethodId, MethodSpec> = {
  mwl: { label: "Muslim World League", fajrAngle: 18 },
  ummAlQura: { label: "Umm al-Qura, Makkah", fajrAngle: 18.5 },
  isna: { label: "Islamic Society of North America", fajrAngle: 15 },
  egypt: { label: "Egyptian General Authority of Survey", fajrAngle: 19.5 },
  karachi: { label: "University of Islamic Sciences, Karachi", fajrAngle: 18 },
  dubai: { label: "Dubai", fajrAngle: 18.2 },
  jakim: { label: "Malaysia, Singapore and Indonesia (20°)", fajrAngle: 20 },
  tehran: { label: "Institute of Geophysics, Tehran", fajrAngle: 17.7, maghribAngle: 4.5 },
  jafari: { label: "Shia Ithna Ashari (Jafari)", fajrAngle: 16, maghribAngle: 4 },
};

export const CALCULATION_METHOD_IDS = Object.keys(CALCULATION_METHODS) as CalculationMethodId[];

export function isCalculationMethod(value: unknown): value is CalculationMethodId {
  return typeof value === "string" && value in CALCULATION_METHODS;
}

export type PrayerTimesInput = {
  latitude: number;
  longitude: number;
  method: CalculationMethodId;
  /** Minutes added to the calculated Fajr, e.g. -5 or +3 to match a mosque. */
  fajrOffsetMinutes?: number;
  /** Minutes added to the calculated Maghrib. */
  maghribOffsetMinutes?: number;
};

export type FastingTimes = {
  /** Dawn: suhoor ends. Rounded down to the minute, so it is never late. */
  fajr: Date;
  sunrise: Date;
  /** Iftar. Rounded up to the minute, so it is never early. */
  maghrib: Date;
};

const DEG = Math.PI / 180;
const sin = (d: number) => Math.sin(d * DEG);
const cos = (d: number) => Math.cos(d * DEG);
const fix = (a: number, b: number) => {
  const r = a - b * Math.floor(a / b);
  return r < 0 ? r + b : r;
};

/** Declination and equation of time (hours) at a Julian date. */
function sunPosition(jd: number): { decl: number; eqt: number } {
  const D = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * D, 360);
  const q = fix(280.459 + 0.98564736 * D, 360);
  const L = fix(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360);
  const e = 23.439 - 0.00000036 * D;
  const ra = Math.atan2(cos(e) * sin(L), cos(L)) / DEG / 15;
  const eqt = q / 15 - fix(ra, 24);
  const decl = Math.asin(sin(e) * sin(L)) / DEG;
  return { decl, eqt };
}

/**
 * Prayer times for one calendar date at a place, or null where the sun doesn't
 * rise or set that day (inside the polar circles in midsummer or midwinter).
 *
 * Hours are worked in UTC from midnight UTC on `iso`, centred on the place's
 * own solar noon, so the results fall on that calendar date where the place is.
 */
export function fastingTimes(iso: string, input: PrayerTimesInput): FastingTimes | null {
  const method = CALCULATION_METHODS[input.method] ?? CALCULATION_METHODS.mwl;
  const { latitude: lat, longitude: lng } = input;
  const dayStartMs = Date.parse(`${iso}T00:00:00Z`);
  if (!Number.isFinite(dayStartMs) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const jd0 = dayStartMs / 86_400_000 + 2440587.5;

  // UTC hour at which the sun is `angle` degrees below the horizon, before
  // (ccw) or after solar noon. Two passes refine the sun's position for the
  // hour of the event itself.
  const sunAngleTime = (angle: number, guessUtc: number, ccw: boolean): number => {
    let t = guessUtc;
    for (let pass = 0; pass < 2; pass += 1) {
      const { decl, eqt } = sunPosition(jd0 + t / 24);
      const noon = 12 - eqt - lng / 15;
      const cosT = (-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
      if (!(cosT >= -1 && cosT <= 1)) return Number.NaN;
      const T = Math.acos(cosT) / DEG / 15;
      t = ccw ? noon - T : noon + T;
    }
    return t;
  };

  const solarToUtc = (localSolarHour: number) => localSolarHour - lng / 15;
  const sunrise = sunAngleTime(0.833, solarToUtc(6), true);
  const sunset = sunAngleTime(0.833, solarToUtc(18), false);
  if (!Number.isFinite(sunrise) || !Number.isFinite(sunset)) return null;

  // Far from the equator in summer the sun may never get 18° below the
  // horizon. The usual fix ("angle-based" rule, the default in most apps):
  // Fajr is at most angle/60 of the night before sunrise.
  const night = 24 - (sunset - sunrise);
  let fajr = sunAngleTime(method.fajrAngle, solarToUtc(5), true);
  const fajrPortion = (method.fajrAngle / 60) * night;
  if (!Number.isFinite(fajr) || sunrise - fajr > fajrPortion) fajr = sunrise - fajrPortion;

  let maghrib = sunset;
  if (method.maghribAngle) {
    const m = sunAngleTime(method.maghribAngle, solarToUtc(18.5), false);
    const portion = (method.maghribAngle / 60) * night;
    maghrib = !Number.isFinite(m) || m - sunset > portion ? sunset + portion : m;
  }

  const MIN = 60_000;
  const at = (hours: number) => dayStartMs + hours * 3_600_000;
  return {
    fajr: new Date(Math.floor(at(fajr) / MIN) * MIN + (input.fajrOffsetMinutes ?? 0) * MIN),
    sunrise: new Date(Math.round(at(sunrise) / MIN) * MIN),
    maghrib: new Date(Math.ceil(at(maghrib) / MIN) * MIN + (input.maghribOffsetMinutes ?? 0) * MIN),
  };
}
