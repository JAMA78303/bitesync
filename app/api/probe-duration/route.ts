/**
 * TEMPORARY — measures the platform's function time limit. Waits `ms` and
 * reports back; if the platform kills the function first, the caller sees the
 * cut-off instead of a reply. Remove once the limit is known. Capped so it
 * cannot be used to tie up a function for long.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const started = Date.now();
  const ms = Math.min(120_000, Math.max(0, Number(new URL(request.url).searchParams.get("ms") ?? 0)));
  await new Promise((r) => setTimeout(r, ms));
  return Response.json({ requested_ms: ms, elapsed_ms: Date.now() - started });
}
