"use client";

import type { LeagueRow, StatsSummary } from "@/lib/types";
import { signedMoney } from "@/lib/format";

function Table({ title, rows, tone }: { title: string; rows: LeagueRow[]; tone: "profit" | "loss" }) {
  if (rows.length === 0) return null;
  return (
    <div className="panel px-4 py-4">
      <div className="label mb-3">{title}</div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.league} className="border-t border-[var(--line)] first:border-t-0">
              <td className="py-2 pr-2">
                {r.league}
                <span className="text-[var(--ink-dim)] text-[10px] tnum"> · {r.count}</span>
              </td>
              <td
                className={`py-2 text-right tnum font-semibold whitespace-nowrap ${
                  tone === "profit" ? "text-[var(--green-bright)]" : "text-[var(--red-bright)]"
                }`}
              >
                {signedMoney(r.pnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    <section className="rise rise-5">
      <h2 className="label mb-3">Where the Money Went</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Table title="Bleeding You Dry (worst 5)" rows={worst} tone="loss" />
        <Table title="Actually Paying (best 5)" rows={best} tone="profit" />
      </div>
    </section>
  );
}
