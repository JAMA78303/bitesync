import { APP_EVENT_NAMES } from "@/lib/analytics/appEvents";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type EventRow = {
  created_at: string;
  name: string;
  props: Record<string, unknown> | null;
  user_id: string | null;
  platform: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const card = "rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]";
const th = "px-3 py-2 text-left text-xs font-semibold text-[var(--text-muted)]";
const td = "px-3 py-2 text-sm text-[var(--text-secondary)]";

/** "placement=today · action=viewed", or "(no details)". */
function describeProps(props: Record<string, unknown> | null): string {
  const entries = Object.entries(props ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return entries.length ? entries.map(([k, v]) => `${k}=${String(v)}`).join(" · ") : "(no details)";
}

/**
 * The last 30 days of events, and the moment they were read. The clock is
 * read here rather than in the page body: React's purity lint rejects
 * Date.now() during render (same pattern as the AI visits page).
 */
async function loadEvents() {
  const now = Date.now();
  const { data, error } = await createServiceClient()
    .from("app_events")
    .select("created_at, name, props, user_id, platform")
    .gte("created_at", new Date(now - 30 * DAY_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(20000);
  return { data, error, now };
}

export default async function AdminEventsPage() {
  const { data, error, now } = await loadEvents();

  if (error) {
    return (
      <div className={`${card} p-6`}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Product events</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Couldn&apos;t read events ({error.message}). If the table doesn&apos;t exist yet, run{" "}
          <code>sql/2026-11-16_app_events.sql</code> in the Supabase SQL editor.
        </p>
      </div>
    );
  }

  const rows = (data ?? []) as EventRow[];
  const weekAgo = now - 7 * DAY_MS;
  const dayAgo = now - DAY_MS;

  const byName = new Map<string, EventRow[]>();
  for (const r of rows) byName.set(r.name, [...(byName.get(r.name) ?? []), r]);

  // Listed order first, so related events sit together; anything unknown after.
  const names = [
    ...APP_EVENT_NAMES.filter((n) => byName.has(n)),
    ...[...byName.keys()].filter((n) => !(APP_EVENT_NAMES as readonly string[]).includes(n)),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Product events</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          The last 30 days of first-run, planning, upgrade and photo-logging events. Recorded in production only.
          {rows.length >= 20000 ? " Showing the most recent 20,000." : ""}
        </p>
      </div>

      <section className={card}>
        <h2 className="px-4 pt-4 text-sm font-semibold text-[var(--text-primary)]">By event</h2>
        {names.length === 0 ? (
          <p className="px-4 pb-4 pt-2 text-sm text-[var(--text-muted)]">No events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-2 w-full">
              <thead>
                <tr>
                  <th className={th}>Event</th>
                  <th className={th}>24 hours</th>
                  <th className={th}>7 days</th>
                  <th className={th}>30 days</th>
                  <th className={th}>People (30 days)</th>
                  <th className={th}>In the app</th>
                </tr>
              </thead>
              <tbody>
                {names.map((name) => {
                  const list = byName.get(name) ?? [];
                  const t = (r: EventRow) => Date.parse(r.created_at);
                  return (
                    <tr key={name} className="border-t border-[var(--border-subtle)]">
                      <td className={`${td} font-medium text-[var(--text-primary)]`}>{name}</td>
                      <td className={td}>{list.filter((r) => t(r) >= dayAgo).length}</td>
                      <td className={td}>{list.filter((r) => t(r) >= weekAgo).length}</td>
                      <td className={td}>{list.length}</td>
                      <td className={td}>{new Set(list.map((r) => r.user_id).filter(Boolean)).size}</td>
                      <td className={td}>{list.filter((r) => r.platform === "ios").length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {names.map((name) => {
        const list = byName.get(name) ?? [];
        const byDetail = new Map<string, number>();
        for (const r of list) {
          const key = describeProps(r.props);
          byDetail.set(key, (byDetail.get(key) ?? 0) + 1);
        }
        const details = [...byDetail.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (details.length < 2 && details[0]?.[0] === "(no details)") return null;
        return (
          <section key={name} className={card}>
            <h2 className="px-4 pt-4 text-sm font-semibold text-[var(--text-primary)]">{name}, last 30 days</h2>
            <table className="mt-2 w-full">
              <tbody>
                {details.map(([detail, n]) => (
                  <tr key={detail} className="border-t border-[var(--border-subtle)]">
                    <td className={td}>{detail}</td>
                    <td className={`${td} w-20 text-right`}>{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
