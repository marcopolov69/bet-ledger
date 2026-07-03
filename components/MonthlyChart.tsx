"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StatsSummary } from "@/lib/types";
import { monthLabel, signedMoney } from "@/lib/format";

export default function MonthlyChart({ stats }: { stats: StatsSummary }) {
  const data = stats.monthly;
  if (data.length === 0) return null;

  return (
    <div className="panel px-4 py-4 rise rise-3">
      <div className="label mb-3">Monthly P&amp;L</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={monthLabel}
              tick={{ fill: "var(--ink-dim)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              minTickGap={24}
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
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "var(--bg-deep)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--ink-dim)" }}
              itemStyle={{ color: "var(--ink)" }}
              labelFormatter={(m) => monthLabel(String(m))}
              formatter={(value) => [signedMoney(Number(value)), "P&L"]}
            />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {data.map((m) => (
                <Cell
                  key={m.month}
                  fill={m.pnl < 0 ? "var(--red)" : "var(--green)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
