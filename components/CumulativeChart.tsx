"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StatsSummary } from "@/lib/types";
import { shortDate, signedMoney } from "@/lib/format";

export default function CumulativeChart({ stats }: { stats: StatsSummary }) {
  const data = stats.cumulative;
  if (data.length === 0) return null;
  const final = data[data.length - 1].pnl;
  const color = final < 0 ? "var(--red)" : "var(--green)";

  return (
    <div className="panel px-4 py-4 rise rise-2">
      <div className="label mb-3">Cumulative P&amp;L</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t: number) =>
                new Date(t).toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                })
              }
              tick={{ fill: "var(--ink-dim)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              minTickGap={48}
            />
            <YAxis
              tickFormatter={(v: number) => `$${v}`}
              tick={{ fill: "var(--ink-dim)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <ReferenceLine y={0} stroke="var(--ink-dim)" strokeOpacity={0.5} />
            <Tooltip
              contentStyle={{
                background: "var(--bg-deep)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--ink-dim)" }}
              itemStyle={{ color: "var(--ink)" }}
              labelFormatter={(t) => shortDate(Number(t))}
              formatter={(value) => [signedMoney(Number(value)), "P&L"]}
            />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke={color}
              strokeWidth={2}
              fill="url(#pnlFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
