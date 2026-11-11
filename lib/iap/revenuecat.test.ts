import { accountIdsInEvent, proUntilFromSubscriber } from "@/lib/iap/revenuecat";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const A = "3f2b8c1e-9d4a-4f6b-8a2e-1c5d7e9f0a1b";
const B = "7a1c2d3e-4f5a-4b6c-9d8e-0f1a2b3c4d5e";

// No Pro entitlement on record: never paid.
assert(proUntilFromSubscriber(null) === null, "no subscriber");
assert(proUntilFromSubscriber({ entitlements: {} }) === null, "no entitlements");
assert(proUntilFromSubscriber({ entitlements: { other: { expires_date: "2027-01-01T00:00:00Z" } } }) === null, "another entitlement isn't Pro");

// The expiry is reported as it is, past or future; access.ts compares it with now.
assert(
  proUntilFromSubscriber({ entitlements: { pro: { expires_date: "2026-12-10T09:00:00Z" } } }) === "2026-12-10T09:00:00.000Z",
  "expiry is passed through",
);
// Apple's billing grace period extends access while a card is retried.
assert(
  proUntilFromSubscriber({
    entitlements: { pro: { expires_date: "2026-12-10T09:00:00Z", grace_period_expires_date: "2026-12-26T09:00:00Z" } },
  }) === "2026-12-26T09:00:00.000Z",
  "the grace period counts",
);
assert(proUntilFromSubscriber({ entitlements: { pro: { expires_date: null } } })!.startsWith("9999"), "no expiry means it doesn't end");
assert(proUntilFromSubscriber({ entitlements: { pro: { expires_date: "garbage" } } }) === null, "an unreadable date grants nothing");

// Webhook events: only real account ids, each once; anonymous RevenueCat ids are ignored.
const ids = accountIdsInEvent({
  app_user_id: A,
  original_app_user_id: "$RCAnonymousID:abc123",
  aliases: [A, "$RCAnonymousID:abc123"],
  transferred_from: [B],
  transferred_to: [A],
});
assert(ids.length === 2 && ids.includes(A) && ids.includes(B), "accounts in a transfer event");
assert(accountIdsInEvent(null).length === 0 && accountIdsInEvent({ app_user_id: 42 }).length === 0, "junk has no accounts");

console.log("revenuecat tests passed");
