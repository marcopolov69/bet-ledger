"use client";

import type { StatsSummary } from "@/lib/types";
import { pct, signedMoney } from "@/lib/format";

export default function OddsBands({ stats }: { stats: StatsSummary }) {
  const bands = stats.oddsBands;
  const maxCount = Math.max(1, ...bands.map((b) => b.count));

  return (
    <div className="panel px-4 py-4 rise rise-3">
      <div className="label mb-4">By Odds Band (decimal)</div>
      <div className="space-y-3">
        {bands.map((b) => (
          <div key={b.label} className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
            <div className="display font-semibold text-[var(--amber)] text-lg tnum">
              {b.label}
            </div>
            <div>
              <div className="h-2 rounded-full bg-[var(--bg-deep)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(b.count / maxCount) * 100}%`,
                    background: b.pnl < 0 ? "var(--red)" : "var(--green)",
                    opacity: b.count === 0 ? 0.15 : 0.9,
                  }}
                />
              </div>
              <div className="text-[10px] text-[var(--ink-dim)] mt-1 tnum">
                {b.count} bet{b.count === 1 ? "" : "s"}
                {b.winRate !== null && <> · {pct(b.winRate)} win rate</>}
              </div>
            </div>
            <div
              className={`tnum font-semibold text-sm ${
                b.pnl < 0
                  ? "text-[var(--red-bright)]"
                  : b.pnl > 0
                    ? "text-[var(--green-bright)]"
                    : "text-[var(--ink-dim)]"
              }`}
            >
              {signedMoney(b.pnl)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
