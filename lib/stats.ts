// Bet[] → StatsSummary. Pure, serializable, no React/browser dependencies.
// This exact object becomes the Phase 2 leaderboard payload.

import type { Bet, BetRef, LeagueRow, OddsBand, StatsSummary } from "./types";

const SETTLED = new Set(["Won", "Lost", "Cashed Out"]);

function isSettled(b: Bet): boolean {
  return SETTLED.has(b.status);
}

/** P&L = payout − wager. Never trust Winnings (cash-outs can be negative). */
function pnlOf(b: Bet): number {
  return (b.payout ?? 0) - (b.wager ?? 0);
}

function toRef(b: Bet): BetRef {
  return {
    match: b.match,
    market: b.market,
    league: b.league,
    price: b.price,
    wager: b.wager ?? 0,
    payout: b.payout ?? 0,
    pnl: pnlOf(b),
    placedAt: b.placedAt,
    status: b.status,
    potentialPayout: b.potentialPayout,
    legs: b.legs.map((l) =>
      [l.match, l.market].filter(Boolean).join(" — ")
    ),
  };
}

/** Strip trailing ", Regular" / ", Playoffs" so e.g. NCAA groups together. */
export function normalizeLeague(league: string): string {
  const l = league.replace(/,\s*(Regular|Playoffs)\s*$/i, "").trim();
  return l === "" ? "Parlays / Other" : l;
}

const ODDS_BANDS: { label: string; min: number; max: number }[] = [
  { label: "<2.0", min: -Infinity, max: 2.0 },
  { label: "2.0–3.0", min: 2.0, max: 3.0 },
  { label: "3.0–5.0", min: 3.0, max: 5.0 },
  { label: "5.0–10", min: 5.0, max: 10.0 },
  { label: "10+", min: 10.0, max: Infinity },
];

export function computeStats(bets: Bet[]): StatsSummary {
  const settled = bets
    .filter(isSettled)
    .sort((a, b) => a.placedAt - b.placedAt);
  const open = bets.filter((b) => b.status === "Open");
  const voids = bets.filter((b) => b.status === "Void");

  const wins = settled.filter((b) => b.status === "Won");
  const losses = settled.filter((b) => b.status === "Lost");
  const cashouts = settled.filter((b) => b.status === "Cashed Out");

  const totalWagered = settled.reduce((s, b) => s + (b.wager ?? 0), 0);
  const totalReturned = settled.reduce((s, b) => s + (b.payout ?? 0), 0);
  const netPnl = totalReturned - totalWagered;
  const decided = wins.length + losses.length;

  // Cumulative P&L curve (running sum over settled bets in date order).
  let running = 0;
  const cumulative = settled.map((b) => {
    running += pnlOf(b);
    return { t: b.placedAt, pnl: Math.round(running * 100) / 100 };
  });

  // Monthly P&L.
  const monthlyMap = new Map<string, { pnl: number; count: number }>();
  for (const b of settled) {
    const d = new Date(b.placedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = monthlyMap.get(key) ?? { pnl: 0, count: 0 };
    cur.pnl += pnlOf(b);
    cur.count += 1;
    monthlyMap.set(key, cur);
  }
  const monthly = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      pnl: Math.round(v.pnl * 100) / 100,
      count: v.count,
    }));

  // Odds bands.
  const oddsBands: OddsBand[] = ODDS_BANDS.map((band) => {
    const inBand = settled.filter(
      (b) => b.price !== null && b.price >= band.min && b.price < band.max
    );
    const w = inBand.filter((b) => b.status === "Won").length;
    const l = inBand.filter((b) => b.status === "Lost").length;
    return {
      label: band.label,
      count: inBand.length,
      wins: w,
      losses: l,
      winRate: w + l > 0 ? w / (w + l) : null,
      pnl: Math.round(inBand.reduce((s, b) => s + pnlOf(b), 0) * 100) / 100,
    };
  });

  // Streaks — cash-outs neither break nor extend.
  let winStreak = 0, lossStreak = 0, longestWinStreak = 0, longestLossStreak = 0;
  for (const b of settled) {
    if (b.status === "Won") {
      winStreak += 1;
      lossStreak = 0;
    } else if (b.status === "Lost") {
      lossStreak += 1;
      winStreak = 0;
    }
    longestWinStreak = Math.max(longestWinStreak, winStreak);
    longestLossStreak = Math.max(longestLossStreak, lossStreak);
  }

  // League tables.
  const leagueMap = new Map<string, { pnl: number; count: number }>();
  for (const b of settled) {
    const key = normalizeLeague(b.isParlay ? "" : b.league);
    const cur = leagueMap.get(key) ?? { pnl: 0, count: 0 };
    cur.pnl += pnlOf(b);
    cur.count += 1;
    leagueMap.set(key, cur);
  }
  const leagues: LeagueRow[] = [...leagueMap.entries()]
    .map(([league, v]) => ({
      league,
      count: v.count,
      pnl: Math.round(v.pnl * 100) / 100,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  // Records.
  const maxBy = (arr: Bet[], f: (b: Bet) => number): Bet | null =>
    arr.length === 0
      ? null
      : arr.reduce((best, b) => (f(b) > f(best) ? b : best));

  const positiveWins = settled.filter((b) => pnlOf(b) > 0);
  const biggestWin = maxBy(positiveWins, pnlOf);
  const longestOdds = maxBy(
    wins.filter((b) => b.price !== null),
    (b) => b.price ?? 0
  );
  const biggestStake = maxBy(
    settled.filter((b) => b.wager !== null),
    (b) => b.wager ?? 0
  );

  const parlays = settled.filter((b) => b.isParlay);
  const parlaysWonList = parlays.filter((b) => b.status === "Won");
  const bestParlay = maxBy(parlaysWonList, pnlOf);
  const dreamParlay = bestParlay
    ? null
    : maxBy(
        parlays.filter((b) => b.status === "Lost" && b.potentialPayout !== null),
        (b) => b.potentialPayout ?? 0
      );

  const allSorted = [...bets].sort((a, b) => a.placedAt - b.placedAt);

  return {
    totalBets: bets.length,
    settledCount: settled.length,
    wins: wins.length,
    losses: losses.length,
    cashouts: cashouts.length,
    voids: voids.length,
    openCount: open.length,

    totalWagered: Math.round(totalWagered * 100) / 100,
    totalReturned: Math.round(totalReturned * 100) / 100,
    netPnl: Math.round(netPnl * 100) / 100,
    roi: totalWagered > 0 ? netPnl / totalWagered : null,
    winRate: decided > 0 ? wins.length / decided : null,

    openStake:
      Math.round(open.reduce((s, b) => s + (b.wager ?? 0), 0) * 100) / 100,
    openPotentialPayout:
      Math.round(open.reduce((s, b) => s + (b.potentialPayout ?? 0), 0) * 100) /
      100,

    cumulative,
    monthly,
    oddsBands,

    longestWinStreak,
    longestLossStreak,

    leagues,

    records: {
      biggestWin: biggestWin ? toRef(biggestWin) : null,
      longestOdds: longestOdds ? toRef(longestOdds) : null,
      biggestStake: biggestStake ? toRef(biggestStake) : null,
      bestParlay: bestParlay ? toRef(bestParlay) : null,
      dreamParlay: dreamParlay ? toRef(dreamParlay) : null,
    },

    parlaysAttempted: parlays.length,
    parlaysWon: parlaysWonList.length,

    firstBetAt: allSorted.length > 0 ? allSorted[0].placedAt : null,
    lastBetAt:
      allSorted.length > 0 ? allSorted[allSorted.length - 1].placedAt : null,
  };
}
