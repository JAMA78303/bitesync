import { cleanCountry, cleanRef, HALAL_WANTS, parseHalalSignup } from "@/lib/waitlist/halal";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function form(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const ok = parseHalalSignup(form({ email: "  Aisha@Example.com ", wants: "ramadan", ref: "TikTok_V01" }));
assert(!("error" in ok) && ok.email === "aisha@example.com", "email is trimmed and lower-cased");
assert(!("error" in ok) && ok.wants === "ramadan", "a listed choice is kept");
assert(!("error" in ok) && ok.ref === "tiktok_v01", "ref is cleaned");

const unknownWant = parseHalalSignup(form({ email: "a@b.co", wants: "<script>" }));
assert(!("error" in unknownWant) && unknownWant.wants === null, "anything not offered is dropped");

const blank = parseHalalSignup(form({ email: "a@b.co", wants: "" }));
assert(!("error" in blank) && blank.wants === null && blank.ref === null, "blank choice and ref mean not answered");

assert("error" in parseHalalSignup(form({ email: "not-an-email" })), "a bad email is rejected");
const bot = parseHalalSignup(form({ email: "a@b.co", website: "spam.example" }));
assert("error" in bot && bot.error === "bot", "the honeypot catches bots");

assert(cleanRef("<x>") === "x", "ref keeps only safe characters");
assert(cleanRef("") === null && cleanRef(null) === null, "empty ref is null");
assert(cleanRef("a".repeat(100))?.length === 40, "ref is capped at 40 characters");

assert(cleanCountry("GB") === "GB", "a country code is kept");
assert(cleanCountry("gb") === null && cleanCountry("GBR") === null && cleanCountry(null) === null, "anything else is null");

assert(new Set(HALAL_WANTS.map((w) => w.value)).size === HALAL_WANTS.length, "choices are unique");
console.log("halal.test.ts: all assertions passed");
