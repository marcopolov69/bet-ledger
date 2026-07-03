"use client";

import type { StatsSummary } from "@/lib/types";
import { americanOdds, money, pct } from "@/lib/format";

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "profit" | "loss" | "odds";
}) {
  const color =
    tone === "profit"
      ? "text-[var(--green-bright)]"
      : tone === "loss"
        ? "text-[var(--red-bright)]"
        : tone === "odds"
          ? "text-[var(--amber)]"
          : "text-[var(--ink)]";
  return (
    <div className="panel px-4 py-4">
      <div className="label">{label}</div>
      <div className={`display font-bold tnum text-2xl sm:text-3xl mt-1 ${color}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-[var(--ink-dim)] mt-1">{sub}</div>}
    </div>
  );
}

export default function StatGrid({ stats }: { stats: StatsSummary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 rise rise-1">
      <Stat
        label="Win Rate"
        value={stats.winRate !== null ? pct(stats.winRate) : "—"}
        sub={`${stats.wins}W · ${stats.losses}L (cash-outs excluded)`}
      />
      <Stat
        label="Total Bets"
        value={String(stats.totalBets)}
        sub={`${stats.settledCount} settled · ${stats.voids} void`}
      />
      <Stat
        label="Longest Win Streak"
        value={String(stats.longestWinStreak)}
        tone="profit"
        sub="consecutive wins"
      />
      <Stat
        label="Longest Skid"
        value={String(stats.longestLossStreak)}
        tone="loss"
        sub="consecutive losses"
      />
      <Stat
        label="Parlays Hit"
        value={`${stats.parlaysWon} / ${stats.parlaysAttempted}`}
        tone={stats.parlaysWon > 0 ? "profit" : "loss"}
        sub="won / attempted"
      />
      <Stat
        label="Longest Odds Cashed"
        value={
          stats.records.longestOdds?.price != null
            ? stats.records.longestOdds.price.toFixed(2)
            : "—"
        }
        tone="odds"
        sub={
          stats.records.longestOdds?.price != null
            ? `${americanOdds(stats.records.longestOdds.price)} American`
            : "no wins yet"
        }
      />
      <Stat
        label="Tickets Riding"
        value={String(stats.openCount)}
        sub={
          stats.openCount > 0
            ? `${money(stats.openStake)} staked · to win ${money(stats.openPotentialPayout)}`
            : "no open bets"
        }
      />
      <Stat
        label="Avg Stake"
        value={
          stats.settledCount > 0
            ? money(stats.totalWagered / stats.settledCount)
            : "—"
        }
        sub="per settled bet"
      />
    </div>
  );
}
