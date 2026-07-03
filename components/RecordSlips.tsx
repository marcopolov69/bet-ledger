"use client";

import type { BetRef, StatsSummary } from "@/lib/types";
import { americanOdds, money, shortDate, signedMoney } from "@/lib/format";

function Slip({
  title,
  bet,
  big,
  bigTone,
  rot,
}: {
  title: string;
  bet: BetRef;
  big: string;
  bigTone: "profit" | "loss" | "odds";
  rot: string;
}) {
  const toneColor =
    bigTone === "profit" ? "#1e7d4b" : bigTone === "loss" ? "#c0331d" : "#9c6b1c";
  return (
    <div className="slip px-5 pt-4 pb-0" style={{ transform: `rotate(${rot})` }}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="label-paper">{title}</span>
        <span className="label-paper tnum shrink-0">{shortDate(bet.placedAt)}</span>
      </div>
      <div
        className="display font-extrabold tnum text-3xl mt-2 leading-none"
        style={{ color: toneColor }}
      >
        {big}
      </div>
      <div className="mt-2 text-xs leading-snug min-h-[2.5em]">
        <span className="font-semibold">{bet.match || bet.market}</span>
        {bet.match && bet.market && bet.market !== "MULTIPLE" && (
          <span className="text-[var(--paper-dim)]"> — {bet.market}</span>
        )}
        {bet.legs.length > 0 && (
          <ul className="mt-1 text-[10px] text-[var(--paper-dim)] list-none space-y-0.5">
            {bet.legs.slice(0, 4).map((leg, i) => (
              <li key={i} className="truncate">↳ {leg}</li>
            ))}
            {bet.legs.length > 4 && <li>↳ +{bet.legs.length - 4} more legs</li>}
          </ul>
        )}
      </div>
      <div className="perf mt-3" />
      <div className="flex items-center justify-between py-2.5 text-[10px] text-[var(--paper-dim)] tnum">
        <span>
          stake {money(bet.wager)}
          {bet.price != null && <> · {bet.price.toFixed(2)} ({americanOdds(bet.price)})</>}
        </span>
        <span className="uppercase tracking-widest font-semibold">{bet.status}</span>
      </div>
    </div>
  );
}

export default function RecordSlips({ stats }: { stats: StatsSummary }) {
  const { biggestWin, longestOdds, biggestStake, bestParlay, dreamParlay } =
    stats.records;

  const slips: React.ReactNode[] = [];
  if (biggestWin)
    slips.push(
      <Slip key="win" title="Biggest Win" bet={biggestWin}
        big={signedMoney(biggestWin.pnl)} bigTone="profit" rot="-0.6deg" />
    );
  if (longestOdds && longestOdds.price != null)
    slips.push(
      <Slip key="odds" title="Longest Odds Cashed" bet={longestOdds}
        big={`${longestOdds.price.toFixed(2)}`} bigTone="odds" rot="0.5deg" />
    );
  if (biggestStake)
    slips.push(
      <Slip key="stake" title="Biggest Stake" bet={biggestStake}
        big={money(biggestStake.wager)} bigTone={biggestStake.pnl < 0 ? "loss" : "profit"} rot="-0.4deg" />
    );
  if (bestParlay)
    slips.push(
      <Slip key="parlay" title="Best Parlay Hit" bet={bestParlay}
        big={signedMoney(bestParlay.pnl)} bigTone="profit" rot="0.7deg" />
    );
  else if (dreamParlay)
    slips.push(
      <Slip key="dream" title="Closest Dream Parlay" bet={dreamParlay}
        big={`${money(dreamParlay.potentialPayout ?? 0)}`} bigTone="loss" rot="0.7deg" />
    );

  if (slips.length === 0) return null;

  return (
    <section className="rise rise-4">
      <h2 className="label mb-3">Hall of Fame / Shame</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{slips}</div>
    </section>
  );
}
