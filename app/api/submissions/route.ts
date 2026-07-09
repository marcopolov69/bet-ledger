// Captures each graded export: the raw file plus the server-recomputed
// StatsSummary. Recomputing on the server with the same lib/ modules is the
// Phase 2 anti-cheat pattern — client-sent stats are never trusted.
//
// Privacy: submissions are keyed by day + an anonymous per-browser UUID
// (generated client-side) + a random submission id. No IPs, no fingerprints,
// no names. The raw export itself contains no direct PII.

import { put } from "@vercel/blob";
import { parseBets } from "@/lib/parse";
import { computeStats } from "@/lib/stats";

const MAX_BYTES = 5_000_000;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function POST(req: Request) {
  const text = await req.text();
  if (!text || text.length > MAX_BYTES) {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Only store things that actually parse as a Hard Rock export.
  let stats;
  try {
    stats = computeStats(parseBets(text));
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Anonymous browser-generated id; never derived from IP. Anything that
  // isn't a well-formed UUID gets bucketed under "no-device".
  const rawDevice = req.headers.get("x-device-id")?.toLowerCase() ?? "";
  const deviceId = UUID_RE.test(rawDevice) ? rawDevice : "no-device";

  const receivedAt = new Date();
  const day = receivedAt.toISOString().slice(0, 10);
  const id = crypto.randomUUID();
  const base = `submissions/${day}/${deviceId}/${id}`;

  await Promise.all([
    put(`${base}.xls`, text, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/xml",
    }),
    put(
      `${base}.json`,
      JSON.stringify({
        receivedAt: receivedAt.toISOString(),
        deviceId,
        stats,
      }),
      {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
      }
    ),
  ]);

  return Response.json({ ok: true });
}
