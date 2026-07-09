// Creates a live share link: stores {name, stats} under an unguessable UUID
// in the private Blob store. The /b/[id] page reads it back server-side.

import { put } from "@vercel/blob";
import type { StatsSummary } from "@/lib/types";

const MAX_BYTES = 300_000;
const MAX_NAME = 24;

function looksLikeStats(s: unknown): s is StatsSummary {
  if (typeof s !== "object" || s === null) return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.netPnl === "number" &&
    typeof o.totalWagered === "number" &&
    typeof o.totalBets === "number" &&
    Array.isArray(o.cumulative) &&
    Array.isArray(o.oddsBands) &&
    typeof o.records === "object" &&
    o.records !== null
  );
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!raw || raw.length > MAX_BYTES) {
    return Response.json({ ok: false }, { status: 400 });
  }

  let body: { name?: unknown; stats?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const name =
    typeof body.name === "string" ? body.name.trim().slice(0, MAX_NAME) : "";
  if (!name || !looksLikeStats(body.stats)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await put(
    `shares/${id}.json`,
    JSON.stringify({
      name,
      stats: body.stats,
      createdAt: new Date().toISOString(),
    }),
    {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    }
  );

  return Response.json({ ok: true, id });
}
