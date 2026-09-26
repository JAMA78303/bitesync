import { HEARD_FROM_OPTIONS, parseHeardFrom } from "@/lib/auth/heardFrom";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}
assert(parseHeardFrom("tiktok") === "tiktok", "a listed value is kept");
assert(parseHeardFrom(" reddit ") === "reddit", "whitespace is trimmed");
assert(parseHeardFrom("") === null, "blank means not answered");
assert(parseHeardFrom(null) === null, "missing means not answered");
assert(parseHeardFrom("<script>") === null, "anything not offered is dropped");
assert(new Set(HEARD_FROM_OPTIONS.map((o) => o.value)).size === HEARD_FROM_OPTIONS.length, "values are unique");
console.log("heardFrom.test.ts: all assertions passed");
