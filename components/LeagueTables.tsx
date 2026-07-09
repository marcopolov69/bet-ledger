"use client";

import type { LeagueRow, StatsSummary } from "@/lib/types";
import { signedMoney } from "@/lib/format";

function Table({ title, rows, tone }: { title: string; rows: LeagueRow[]; tone: "profit" | "loss" }) {
  return (
    <div className="panel px-4 py-4">
      <div className="label mb-3">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-[var(--ink-dim)] py-2">Nothing here — yet.</div>
      ) : (
        <div>
          {rows.map((r) => (
            <div
              key={r.league}
              className="flex items-baseline justify-between gap-3 py-2 border-t border-[var(--line)] first:border-t-0"
            >
              <span className="text-sm truncate min-w-0">
                {r.league}
                <span className="text-[var(--ink-dim)] text-[10px] tnum whitespace-nowrap"> · {r.count}</span>
              </span>
              <span
                className={`text-sm tnum font-semibold whitespace-nowrap shrink-0 ${
                  tone === "profit" ? "text-[var(--green-bright)]" : "text-[var(--red-bright)]"
                }`}
              >
                {signedMoney(r.pnl)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeagueTables({ stats }: { stats: StatsSummary }) {
  const best = stats.leagues.filter((l) => l.pnl > 0).slice(0, 5);
  const worst = stats.leagues
    .filter((l) => l.pnl < 0)
    .slice(-5)
    .reverse();

  if (best.length === 0 && worst.length === 0) return null;

  return (
    <>
      <Table title="Bleeding You Dry (worst 5)" rows={worst} tone="loss" />
      <Table title="Actually Paying (best 5)" rows={best} tone="profit" />
    </>
  );
}
