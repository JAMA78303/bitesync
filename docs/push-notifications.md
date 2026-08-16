# Push notification setup

Weekly-ritual reminders: a Sunday "plan your week" nudge (only sent when the user's
next week is still empty) and an opt-in daily "log your meals" reminder.

Nothing sends until the three setup steps below are done. Until then the Reminders
card in Settings hides itself and the cron endpoint returns `503`.

## 1. Run the database migration

Paste `sql/2026-08-16_push_subscriptions.sql` into the Supabase SQL editor and run it.

It creates `push_subscriptions` (one row per browser/device), with RLS so users only
ever see their own rows. The cron sender reads across users with the service role.

## 2. Generate VAPID keys

```bash
npm run push:keys
```

Add the printed values to `.env.local` **and** to the Vercel project's environment
variables (Production + Preview):

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public — shipped to the browser |
| `VAPID_PRIVATE_KEY` | **Secret** — never commit |
| `VAPID_SUBJECT` | `mailto:` or `https:` URL you control |
| `CRON_SECRET` | Long random string; Vercel Cron sends it as a bearer token |

Generate keys **once** and reuse them. Rotating `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
invalidates every existing subscription, and users have to re-enable notifications.

## 3. Deploy

`vercel.json` registers two cron jobs; Vercel picks them up on deploy:

| Job | Schedule (UTC) | Local time |
| --- | --- | --- |
| `?kind=weekly` | `0 16 * * 0` — Sundays | 5pm BST / 4pm GMT |
| `?kind=daily` | `0 19 * * *` — daily | 8pm BST / 7pm GMT |

Cron schedules are UTC-only, so send times shift by an hour across BST/GMT. Both
windows stay within a sensible afternoon/evening either way.

## How it behaves

- **Weekly nudge** is on by default when a user enables notifications — it is the core
  ritual. It is skipped for anyone who has already planned meals for the upcoming week,
  so it nudges rather than nags.
- **Daily reminder** is off by default and must be opted into.
- `last_weekly_sent_on` / `last_daily_sent_on` guard against double-sends if a cron
  job fires more than once in a day.
- Subscriptions rejected by the push service with `404`/`410` are deleted automatically.

## Testing

With the env vars set, Settings → Reminders → **Send test** delivers a real
notification to the current device.

To exercise the cron endpoint locally:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/push-reminders?kind=weekly"
```

It responds with `{ ok, kind, sent, skipped, removed, failed }`. Without a valid
bearer token it returns `401`.

## Browser support

Chrome, Edge, and Firefox work on desktop and Android with no extra steps.

**iOS/iPadOS only deliver web push to PWAs installed to the Home Screen** (iOS 16.4+).
The Settings card detects this and tells the user to add BiteSync to their Home Screen
first. There is no way around this restriction from the web.

## Service worker note

`public/sw.js` deliberately has **no `fetch` handler** — it never caches app responses,
so it cannot pin users to a stale build. If caching is added later, version the cache
and clear it on `activate`.
