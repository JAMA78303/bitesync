import { isAppEventName, sanitizeEventProps } from "@/lib/analytics/appEvents";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

assert(isAppEventName("week_generated"), "a listed event is accepted");
assert(isAppEventName("photo_log_saved"), "photo logging events are listed");
assert(!isAppEventName("drop_table"), "an unlisted name is rejected");
assert(!isAppEventName(42), "a non-string name is rejected");

const props = sanitizeEventProps({
  source: "ai",
  step: 2,
  ok: true,
  none: null,
  "Bad Key": "x",
  nested: { a: 1 },
  list: [1, 2],
  nan: Number.NaN,
  long: "x".repeat(500),
});
assert(props.source === "ai" && props.step === 2 && props.ok === true && props.none === null, "plain values kept");
assert(!("Bad Key" in props) && !("nested" in props) && !("list" in props) && !("nan" in props), "bad keys and values dropped");
assert(typeof props.long === "string" && props.long.length === 80, "long strings are cut to 80 characters");

const many = sanitizeEventProps(Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, i])));
assert(Object.keys(many).length === 8, "at most 8 properties");

assert(Object.keys(sanitizeEventProps("nope")).length === 0, "non-objects give no properties");
assert(Object.keys(sanitizeEventProps([1, 2])).length === 0, "arrays give no properties");

console.log("appEvents tests passed");
