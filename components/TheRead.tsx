"use client";

import type { StatsSummary } from "@/lib/types";
import { generateInsights } from "@/lib/insights";

const KIND_STYLE = {
  leak: { chip: "LEAK", color: "var(--red-bright)", bg: "rgba(226,84,62,0.12)" },
  edge: { chip: "EDGE", color: "var(--green-bright)", bg: "rgba(8,201,114,0.12)" },
  note: { chip: "NOTE", color: "var(--amber)", bg: "rgba(232,163,61,0.12)" },
} as const;

export default function TheRead({ stats }: { stats: StatsSummary }) {
  const insights = generateInsights(stats);
  if (insights.length === 0) return null;

  return (
    <section className="rise rise-5">
      <h2 className="label mb-1">The Read</h2>
      <p className="text-[11px] text-[var(--ink-dim)] mb-3">
        What your own numbers say — no model, no picks, just your history.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {insights.map((ins, i) => {
          const style = KIND_STYLE[ins.kind];
          return (
            <div
              key={i}
              className={`panel px-4 py-4 ${
                i === 0 && insights.length % 2 === 1 ? "sm:col-span-2" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-bold tracking-[0.18em] rounded px-1.5 py-0.5"
                  style={{ color: style.color, background: style.bg }}
                >
                  {style.chip}
                </span>
                <span className="display font-bold text-lg leading-tight">
                  {ins.title}
                </span>
              </div>
              <p className="text-sm text-[var(--ink-dim)] leading-relaxed">
                {ins.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
