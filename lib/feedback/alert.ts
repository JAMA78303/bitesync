import { SUPPORT_EMAIL } from "@/lib/support";

/**
 * Emails the founder when someone sends feedback from the app.
 *
 * Feedback used to go only into feedback_submissions, with nothing to say a
 * row had arrived — a support request could sit unread indefinitely. This
 * sends it through Resend (already verified for bitesync.io, which sends the
 * auth emails) to hello@bitesync.io, which forwards to the founder's inbox.
 * Reply-To is the user, so answering is one tap.
 *
 * Needs RESEND_API_KEY in the environment; without it, nothing is sent and
 * the feedback is still saved. Never throws.
 */
export async function sendFeedbackAlert(feedback: {
  message: string;
  expected?: string | null;
  screen: string;
  userEmail?: string | null;
  appVersion?: string | null;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[feedback-alert] RESEND_API_KEY not set — feedback saved, no email sent");
    return;
  }

  const to = process.env.FEEDBACK_ALERT_TO || SUPPORT_EMAIL;
  const from = process.env.FEEDBACK_ALERT_FROM || "BiteSync feedback <feedback@bitesync.io>";
  const lines = [
    `From: ${feedback.userEmail ?? "unknown user"}`,
    `Screen: ${feedback.screen}`,
    `App version: ${feedback.appVersion ?? "unknown"}`,
    "",
    "What happened:",
    feedback.message,
  ];
  if (feedback.expected) lines.push("", "What they expected:", feedback.expected);
  lines.push("", "All feedback: https://bitesync.io/admin/feedback");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        ...(feedback.userEmail ? { reply_to: feedback.userEmail } : {}),
        subject: `BiteSync feedback: ${feedback.message.slice(0, 60)}${feedback.message.length > 60 ? "…" : ""}`,
        text: lines.join("\n"),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.warn("[feedback-alert] Resend returned", res.status, (await res.text()).slice(0, 200));
  } catch (err) {
    console.warn("[feedback-alert] send failed:", err instanceof Error ? err.message : err);
  }
}
