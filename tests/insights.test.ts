import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBets } from "../lib/parse";
import { computeStats } from "../lib/stats";
import { generateInsights } from "../lib/insights";
import type { StatsSummary } from "../lib/types";

const fixtureStats = computeStats(
  parseBets(
    readFileSync(
      join(__dirname, "fixtures", "All_Bets_Export_fixture.xls"),
      "utf-8"
    )
  )
);

/** Degenerate profile: heavy parlays, long-odds losses, one good league. */
function degenStats(): StatsSummary {
  return {
    ...fixtureStats,
    netPnl: -675.8,
    totalWagered: 1746.21,
    settledCount: 197,
    parlaysAttempted: 38,
    parlaysWon: 2,
    longestLossStreak: 85,
    monthly: Array.from({ length: 27 }, (_, i) => ({
      month: `2024-${String((i % 12) + 1).padStart(2, "0")}`,
      pnl: -25,
      count: 7,
    })),
    oddsBands: [
      { label: "<2.0", count: 8, wins: 4, losses: 4, winRate: 0.5, pnl: 3.87 },
      { label: "10+", count: 89, wins: 0, losses: 89, winRate: 0, pnl: -454.31 },
    ],
    leagues: [
      { league: "NHL", count: 11, pnl: 66.91 },
      { league: "Parlays / Other", count: 38, pnl: -238.5 },
      { league: "NCAA", count: 45, pnl: -258.06 },
    ],
  };
}

describe("generateInsights", () => {
  const insights = generateInsights(degenStats());
  const titles = insights.map((i) => i.title).join(" | ");

  it("caps at 5 and puts leaks first", () => {
    expect(insights.length).toBeLessThanOrEqual(5);
    expect(insights[0].kind).toBe("leak");
  });

  it("flags the parlay problem", () => {
    expect(titles).toContain("Cut the parlays");
  });

  it("flags the worst odds band and the profitable one", () => {
    expect(titles).toContain("Long odds are a tax (10+)");
    expect(titles).toContain("Your edge lives at <2.0 odds");
  });

  it("flags the money-pit league", () => {
    expect(titles).toContain("NCAA is your money pit");
  });

  it("congratulates profitable bettors instead", () => {
    const winner = generateInsights({
      ...degenStats(),
      netPnl: 500,
      parlaysAttempted: 0,
      longestLossStreak: 3,
      leagues: [{ league: "NHL", count: 30, pnl: 500 }],
      oddsBands: [],
      monthly: [],
    });
    expect(winner.some((i) => i.kind === "edge")).toBe(true);
    expect(winner.some((i) => i.title.includes("beating the book"))).toBe(true);
  });

  it("handles the tiny fixture without crashing", () => {
    expect(() => generateInsights(fixtureStats)).not.toThrow();
  });
});
