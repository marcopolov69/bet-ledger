// Captures each graded export: the raw file plus the server-recomputed
// StatsSummary. Recomputing on the server with the same lib/ modules is the
// Phase 2 anti-cheat pattern — client-sent stats are never trusted.

import { put } from "@vercel/blob";
import { parseBets } from "@/lib/parse";
import { computeStats } from "@/lib/stats";

const MAX_BYTES = 5_000_000;

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

  const receivedAt = new Date();
  const day = receivedAt.toISOString().slice(0, 10);
  const id = crypto.randomUUID();

  await Promise.all([
    put(`submissions/${day}/${id}.xls`, text, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/xml",
    }),
    put(
      `submissions/${day}/${id}.json`,
      JSON.stringify({ receivedAt: receivedAt.toISOString(), stats }),
      {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
      }
    ),
  ]);

  return Response.json({ ok: true });
}
