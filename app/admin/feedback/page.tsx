import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  user_id: string | null;
  screen: string;
  message: string;
  expected: string | null;
  app_version: string | null;
  created_at: string;
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const card = "rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]";

/** Latest feedback, with each sender's email so it can be answered. */
async function loadFeedback() {
  const service = createServiceClient();
  const { data, error } = await service
    .from("feedback_submissions")
    .select("id, user_id, screen, message, expected, app_version, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { rows: [] as Row[], emails: new Map<string, string>(), error };

  const emails = new Map<string, string>();
  const { data: users } = await service.auth.admin.listUsers({ perPage: 1000 });
  for (const u of users?.users ?? []) if (u.email) emails.set(u.id, u.email);
  return { rows: (data ?? []) as Row[], emails, error: null };
}

export default async function AdminFeedbackPage() {
  const { rows, emails, error } = await loadFeedback();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Feedback</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Everything sent from the in-app feedback form, newest first. New messages are also emailed to
          hello@bitesync.io when RESEND_API_KEY is set.
        </p>
      </div>

      {error ? (
        <div className={`${card} p-4 text-sm text-[var(--text-muted)]`}>
          Couldn&apos;t read feedback ({error.message}). If this says permission denied, run{" "}
          <code>sql/2026-10-04_feedback_admin_read.sql</code> in the Supabase SQL editor.
        </div>
      ) : rows.length === 0 ? (
        <div className={`${card} p-4 text-sm text-[var(--text-muted)]`}>No feedback yet.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const email = r.user_id ? emails.get(r.user_id) : undefined;
            return (
              <li key={r.id} className={`${card} p-4`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[var(--text-muted)]">
                  <span>
                    {when(r.created_at)} · {r.screen}
                    {r.app_version ? ` · v${r.app_version}` : ""}
                  </span>
                  {email ? (
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent("Re: your BiteSync feedback")}`}
                      className="font-medium text-[var(--text-link)] underline underline-offset-2"
                    >
                      Reply to {email}
                    </a>
                  ) : (
                    <span>Unknown sender</span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-primary)]">{r.message}</p>
                {r.expected ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                    <span className="font-semibold">Expected: </span>
                    {r.expected}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
