import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBets } from "../lib/parse";
import { computeStats, normalizeLeague } from "../lib/stats";

const fixture = readFileSync(
  join(__dirname, "fixtures", "All_Bets_Export_fixture.xls"),
  "utf-8"
);

// Fixture contents (hand-computed expectations):
//   1 Jan  Won        wager 10  payout 25    → +15.00
//   5 Jan  Lost       wager 20  payout null  → -20.00
//  10 Feb  Cashed Out wager 30  payout 22.50 →  -7.50
//  12 Feb  Void       (excluded entirely)
//  15 Feb  Lost parlay wager 10 payout 0     → -10.00 (potential 260)
//   1 Jul  Open       wager 5   potential 60 (excluded from P&L)
const stats = computeStats(parseBets(fixture));

describe("computeStats", () => {
  it("counts statuses", () => {
    expect(stats.totalBets).toBe(6);
    expect(stats.settledCount).toBe(4);
    expect(stats.wins).toBe(1);
    expect(stats.losses).toBe(2);
    expect(stats.cashouts).toBe(1);
    expect(stats.voids).toBe(1);
    expect(stats.openCount).toBe(1);
  });

  it("computes money totals from payout − wager, never Winnings", () => {
    expect(stats.totalWagered).toBe(70);
    expect(stats.totalReturned).toBe(47.5);
    expect(stats.netPnl).toBe(-22.5);
    expect(stats.roi).toBeCloseTo(-22.5 / 70, 10);
  });

  it("computes win rate excluding cash-outs", () => {
    expect(stats.winRate).toBeCloseTo(1 / 3, 10);
  });

  it("surfaces open tickets separately", () => {
    expect(stats.openStake).toBe(5);
    expect(stats.openPotentialPayout).toBe(60);
  });

  it("builds the cumulative P&L curve in date order", () => {
    expect(stats.cumulative.map((p) => p.pnl)).toEqual([15, -5, -12.5, -22.5]);
  });

  it("groups monthly P&L", () => {
    expect(stats.monthly).toEqual([
      { month: "2026-01", pnl: -5, count: 2 },
      { month: "2026-02", pnl: -17.5, count: 2 },
    ]);
  });

  it("buckets odds bands", () => {
    const byLabel = Object.fromEntries(stats.oddsBands.map((b) => [b.label, b]));
    expect(byLabel["<2.0"]).toMatchObject({ count: 1, wins: 0, losses: 1, pnl: -20 });
    expect(byLabel["2.0–3.0"]).toMatchObject({ count: 1, wins: 1, losses: 0, pnl: 15, winRate: 1 });
    expect(byLabel["3.0–5.0"]).toMatchObject({ count: 1, wins: 0, losses: 0, pnl: -7.5, winRate: null });
    expect(byLabel["5.0–10"]).toMatchObject({ count: 0 });
    expect(byLabel["10+"]).toMatchObject({ count: 1, losses: 1, pnl: -10 });
  });

  it("computes streaks with cash-outs neither breaking nor extending", () => {
    // W, L, CO, L → longest win 1, longest loss 2 (CO doesn't reset the L run)
    expect(stats.longestWinStreak).toBe(1);
    expect(stats.longestLossStreak).toBe(2);
  });

  it("builds league tables with normalized names, sorted by pnl", () => {
    expect(stats.leagues).toEqual([
      { league: "NBA", count: 1, pnl: 15 },
      { league: "NCAAB", count: 1, pnl: -7.5 },
      { league: "Parlays / Other", count: 1, pnl: -10 },
      { league: "NFL", count: 1, pnl: -20 },
    ]);
  });

  it("finds the records", () => {
    expect(stats.records.biggestWin?.pnl).toBe(15);
    expect(stats.records.longestOdds?.price).toBe(2.5);
    expect(stats.records.biggestStake?.wager).toBe(30);
    expect(stats.records.biggestStake?.status).toBe("Cashed Out");
  });

  it("falls back to the dream parlay when no parlay has ever hit", () => {
    expect(stats.parlaysAttempted).toBe(1);
    expect(stats.parlaysWon).toBe(0);
    expect(stats.records.bestParlay).toBeNull();
    expect(stats.records.dreamParlay?.potentialPayout).toBe(260);
    expect(stats.records.dreamParlay?.legs).toHaveLength(3);
  });

  it("is JSON-serializable (Phase 2 leaderboard payload)", () => {
    expect(() => JSON.stringify(stats)).not.toThrow();
    expect(JSON.parse(JSON.stringify(stats))).toEqual(stats);
  });
});

describe("normalizeLeague", () => {
  it("strips , Regular / , Playoffs suffixes", () => {
    expect(normalizeLeague("NCAAB, Regular")).toBe("NCAAB");
    expect(normalizeLeague("NBA, Playoffs")).toBe("NBA");
    expect(normalizeLeague("NFL")).toBe("NFL");
  });
});
