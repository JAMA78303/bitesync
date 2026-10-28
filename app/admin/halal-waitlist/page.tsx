import { createServiceClient } from "@/lib/supabase/service";
import { HALAL_WANTS } from "@/lib/waitlist/halal";

export const dynamic = "force-dynamic";

type Signup = { created_at: string; wants: string | null; ref: string | null; country: string | null };
type Visit = { ref: string | null };

const card = "rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]";
const th = "px-3 py-2 text-left text-xs font-semibold text-[var(--text-muted)]";
const td = "px-3 py-2 text-sm text-[var(--text-secondary)]";

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 1000) / 10}%` : "–");

function count<T>(rows: T[], key: (r: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return m;
}

export default async function AdminHalalWaitlistPage() {
  const db = createServiceClient();
  const [signups, visits] = await Promise.all([
    db.from("halal_waitlist").select("created_at, wants, ref, country").limit(10000),
    db.from("halal_waitlist_visits").select("ref").limit(100000),
  ]);

  if (signups.error || visits.error) {
    return (
      <div className={`${card} p-6`}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Halal waitlist</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Couldn&apos;t read the waitlist ({(signups.error ?? visits.error)?.message}). If the tables don&apos;t exist
          yet, run <code>sql/2026-10-28_halal_waitlist.sql</code> in the Supabase SQL editor.
        </p>
      </div>
    );
  }

  const s = (signups.data ?? []) as Signup[];
  const v = (visits.data ?? []) as Visit[];
  const label = (r: string | null) => r ?? "(no ref)";
  const visitsByRef = count(v, (r) => label(r.ref));
  const signupsByRef = count(s, (r) => label(r.ref));
  const refs = [...new Set([...visitsByRef.keys(), ...signupsByRef.keys()])].sort(
    (a, b) => (signupsByRef.get(b) ?? 0) - (signupsByRef.get(a) ?? 0),
  );
  const byWant = count(s, (r) => HALAL_WANTS.find((w) => w.value === r.wants)?.label ?? "Not answered");
  const byCountry = [...count(s, (r) => r.country ?? "Unknown").entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Halal waitlist</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Sign-ups from /halal. Gate A wants at least 10% of visitors to join. Visits are counted in production
          only.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Visits", String(v.length)],
          ["Sign-ups", String(s.length)],
          ["Sign-up rate", pct(s.length, v.length)],
        ].map(([title, value]) => (
          <div key={title} className={`${card} p-4`}>
            <p className="text-xs font-semibold text-[var(--text-muted)]">{title}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          </div>
        ))}
      </div>

      <section className={card}>
        <h2 className="px-4 pt-4 text-sm font-semibold text-[var(--text-primary)]">By video (?ref=)</h2>
        <table className="mt-2 w-full">
          <thead>
            <tr>
              <th className={th}>Ref</th>
              <th className={th}>Visits</th>
              <th className={th}>Sign-ups</th>
              <th className={th}>Rate</th>
            </tr>
          </thead>
          <tbody>
            {refs.map((ref) => (
              <tr key={ref} className="border-t border-[var(--border-subtle)]">
                <td className={`${td} font-mono text-xs`}>{ref}</td>
                <td className={td}>{visitsByRef.get(ref) ?? 0}</td>
                <td className={td}>{signupsByRef.get(ref) ?? 0}</td>
                <td className={td}>{pct(signupsByRef.get(ref) ?? 0, visitsByRef.get(ref) ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className={card}>
          <h2 className="px-4 pt-4 text-sm font-semibold text-[var(--text-primary)]">What they want most</h2>
          <table className="mt-2 w-full">
            <tbody>
              {[...byWant.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([want, n]) => (
                  <tr key={want} className="border-t border-[var(--border-subtle)]">
                    <td className={td}>{want}</td>
                    <td className={td}>{n}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
        <section className={card}>
          <h2 className="px-4 pt-4 text-sm font-semibold text-[var(--text-primary)]">Countries</h2>
          <table className="mt-2 w-full">
            <tbody>
              {byCountry.map(([c, n]) => (
                <tr key={c} className="border-t border-[var(--border-subtle)]">
                  <td className={td}>{c}</td>
                  <td className={td}>{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
