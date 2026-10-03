import { CRAWLER_KIND_LABELS, type CrawlerKind } from "@/lib/analytics/aiCrawlers";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type Visit = { seen_at: string; bot: string; kind: CrawlerKind; path: string };

const KINDS: CrawlerKind[] = ["user", "search", "training", "preview"];
const DAY_MS = 24 * 60 * 60 * 1000;

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const card = "rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]";
const th = "px-3 py-2 text-left text-xs font-semibold text-[var(--text-muted)]";
const td = "px-3 py-2 text-sm text-[var(--text-secondary)]";

/** The last 30 days of visits, and the cutoff for "last 7 days". */
async function loadVisits() {
  const now = Date.now();
  const { data, error } = await createServiceClient()
    .from("ai_crawler_visits")
    .select("seen_at, bot, kind, path")
    .gte("seen_at", new Date(now - 30 * DAY_MS).toISOString())
    .order("seen_at", { ascending: false })
    .limit(5000);
  return { data, error, weekAgo: now - 7 * DAY_MS };
}

export default async function AdminAiVisitsPage() {
  const { data, error, weekAgo } = await loadVisits();

  if (error) {
    return (
      <div className={`${card} p-6`}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI &amp; search visits</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Couldn&apos;t read visits ({error.message}). If the table doesn&apos;t exist yet, run{" "}
          <code>sql/2026-10-03_ai_crawler_visits.sql</code> in the Supabase SQL editor.
        </p>
      </div>
    );
  }

  const visits = (data ?? []) as Visit[];
  const inWeek = (v: Visit) => new Date(v.seen_at).getTime() >= weekAgo;

  const byBot = new Map<string, { kind: CrawlerKind; week: number; month: number; last: string }>();
  for (const v of visits) {
    const row = byBot.get(v.bot) ?? { kind: v.kind, week: 0, month: 0, last: v.seen_at };
    row.month += 1;
    if (inWeek(v)) row.week += 1;
    byBot.set(v.bot, row);
  }
  const bots = [...byBot.entries()].sort(
    (a, b) => KINDS.indexOf(a[1].kind) - KINDS.indexOf(b[1].kind) || b[1].month - a[1].month,
  );

  const answeredPages = new Map<string, { count: number; last: string; bots: Set<string> }>();
  for (const v of visits.filter((x) => x.kind === "user")) {
    const row = answeredPages.get(v.path) ?? { count: 0, last: v.seen_at, bots: new Set<string>() };
    row.count += 1;
    row.bots.add(v.bot);
    answeredPages.set(v.path, row);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI &amp; search visits</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Pages read by AI assistants, search engines and link previews over the last 30 days. Bots name
          themselves, and a name can be faked, so read this as a trend rather than proof.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KINDS.map((kind) => {
          const all = visits.filter((v) => v.kind === kind);
          return (
            <div
              key={kind}
              className={`${card} p-4 ${kind === "user" ? "ring-2 ring-[var(--brand-primary)]" : ""}`}
            >
              <p className="text-xs font-semibold text-[var(--text-muted)]">{CRAWLER_KIND_LABELS[kind].title}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{all.filter(inWeek).length}</p>
              <p className="text-xs text-[var(--text-muted)]">last 7 days · {all.length} in 30 days</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                {CRAWLER_KIND_LABELS[kind].description}
              </p>
            </div>
          );
        })}
      </div>

      <section className={card}>
        <h2 className="px-4 pt-4 text-sm font-semibold text-[var(--text-primary)]">Pages AI read to answer someone</h2>
        {answeredPages.size ? (
          <table className="mt-2 w-full">
            <thead>
              <tr>
                <th className={th}>Page</th>
                <th className={th}>Times</th>
                <th className={th}>By</th>
                <th className={th}>Last</th>
              </tr>
            </thead>
            <tbody>
              {[...answeredPages.entries()]
                .sort((a, b) => b[1].count - a[1].count)
                .map(([path, row]) => (
                  <tr key={path} className="border-t border-[var(--border-subtle)]">
                    <td className={`${td} font-mono text-xs`}>{path}</td>
                    <td className={td}>{row.count}</td>
                    <td className={td}>{[...row.bots].join(", ")}</td>
                    <td className={td}>{when(row.last)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 pb-4 pt-2 text-sm text-[var(--text-muted)]">
            None yet. When ChatGPT, Perplexity, Claude or Meta AI reads a page to answer someone, it appears here.
          </p>
        )}
      </section>

      <section className={card}>
        <h2 className="px-4 pt-4 text-sm font-semibold text-[var(--text-primary)]">Who&apos;s reading</h2>
        {bots.length ? (
          <table className="mt-2 w-full">
            <thead>
              <tr>
                <th className={th}>Bot</th>
                <th className={th}>Kind</th>
                <th className={th}>7 days</th>
                <th className={th}>30 days</th>
                <th className={th}>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {bots.map(([bot, row]) => (
                <tr key={bot} className="border-t border-[var(--border-subtle)]">
                  <td className={td}>{bot}</td>
                  <td className={td}>{CRAWLER_KIND_LABELS[row.kind].title}</td>
                  <td className={td}>{row.week}</td>
                  <td className={td}>{row.month}</td>
                  <td className={td}>{when(row.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 pb-4 pt-2 text-sm text-[var(--text-muted)]">No visits recorded yet.</p>
        )}
      </section>

      <section className={card}>
        <h2 className="px-4 pt-4 text-sm font-semibold text-[var(--text-primary)]">Latest visits</h2>
        {visits.length ? (
          <table className="mt-2 w-full">
            <thead>
              <tr>
                <th className={th}>When</th>
                <th className={th}>Bot</th>
                <th className={th}>Page</th>
              </tr>
            </thead>
            <tbody>
              {visits.slice(0, 50).map((v, i) => (
                <tr key={`${v.seen_at}-${i}`} className="border-t border-[var(--border-subtle)]">
                  <td className={`${td} whitespace-nowrap`}>{when(v.seen_at)}</td>
                  <td className={td}>{v.bot}</td>
                  <td className={`${td} font-mono text-xs`}>{v.path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 pb-4 pt-2 text-sm text-[var(--text-muted)]">No visits recorded yet.</p>
        )}
      </section>
    </div>
  );
}
