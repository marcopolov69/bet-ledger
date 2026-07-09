"use client";

import type { StatsSummary } from "@/lib/types";
import { money, pct, shortDate, signedMoney } from "@/lib/format";

export default function HeroTicket({ stats }: { stats: StatsSummary }) {
  const negative = stats.netPnl < 0;
  const record = `${stats.wins}–${stats.losses}–${stats.cashouts}`;

  return (
    <div className="relative w-full max-w-2xl mx-auto rise">
      <div className="slip overflow-hidden px-6 sm:px-8 pt-6">
        {/* rubber stamp — small, faded, fully visible in the top-right corner */}
        <div
          aria-hidden="true"
          className="absolute top-9 right-4 sm:top-6 sm:right-8 pointer-events-none z-10 opacity-80"
        >
          <div
            className={`stamp stamp-anim display text-sm sm:text-xl whitespace-nowrap ${
              negative ? "stamp--loss" : "stamp--profit"
            }`}
            style={{ "--stamp-rot": "18deg" } as React.CSSProperties}
          >
            {negative ? "House Wins" : "Printing Money"}
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="label-paper">BurryApp · Official Ledger</span>
        </div>

        <div className="text-center pt-8 pb-6">
          <div className="label-paper">All-Time Net Profit / Loss</div>
          <div
            className={`display font-extrabold tnum leading-none tracking-tight text-6xl sm:text-8xl mt-2 ${
              negative ? "text-[#c0331d]" : "text-[#1e7d4b]"
            }`}
          >
            {signedMoney(stats.netPnl)}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 text-center pb-6">
          <div>
            <div className="label-paper">Wagered</div>
            <div className="tnum font-semibold text-sm sm:text-base">
              {money(stats.totalWagered)}
            </div>
          </div>
          <div>
            <div className="label-paper">Returned</div>
            <div className="tnum font-semibold text-sm sm:text-base">
              {money(stats.totalReturned)}
            </div>
          </div>
          <div>
            <div className="label-paper">ROI</div>
            <div className="tnum font-semibold text-sm sm:text-base">
              {stats.roi !== null ? pct(stats.roi) : "—"}
            </div>
          </div>
          <div>
            <div className="label-paper">Record (W–L–CO)</div>
            <div className="tnum font-semibold text-sm sm:text-base">{record}</div>
          </div>
        </div>

        <div className="perf" />

        <div className="flex items-center justify-between gap-4 px-1 py-4">
          <div className="text-[11px] text-[var(--paper-dim)] leading-snug">
            <span className="tnum font-semibold text-[var(--paper-ink)]">
              {stats.settledCount}
            </span>{" "}
            settled bets graded
            {stats.voids > 0 && <> · {stats.voids} void</>}
            {stats.firstBetAt !== null && stats.lastBetAt !== null && (
              <>
                <br />
                <span className="tnum">
                  {shortDate(stats.firstBetAt)} — {shortDate(stats.lastBetAt)}
                </span>
              </>
            )}
          </div>
          <div className="barcode w-32 sm:w-44 shrink-0" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
