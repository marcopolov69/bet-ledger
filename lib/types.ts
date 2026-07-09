// Shared types for BurryApp.
// Everything here must stay serializable (plain JSON) — StatsSummary is the
// future Phase 2 leaderboard payload.

export type ParentStatus = "Won" | "Lost" | "Cashed Out" | "Void" | "Open";

export interface BetLeg {
  status: string; // "Win" | "Lose" on legs
  league: string;
  match: string;
  betType: string;
  market: string;
  price: number | null;
  result: string;
}

export interface Bet {
  datePlacedRaw: string;
  placedAt: number; // epoch ms
  status: ParentStatus;
  league: string;
  match: string;
  betType: string;
  market: string;
  price: number | null; // decimal odds
  wager: number | null;
  winnings: number | null;
  payout: number | null;
  potentialPayout: number | null;
  result: string;
  betSlipId: string;
  isParlay: boolean;
  legs: BetLeg[];
}

export interface BetRef {
  match: string;
  market: string;
  league: string;
  price: number | null;
  wager: number;
  payout: number;
  pnl: number;
  placedAt: number;
  status: ParentStatus;
  potentialPayout: number | null;
  legs: string[]; // human-readable leg descriptions (parlays)
}

export interface OddsBand {
  label: string;
  count: number;
  wins: number;
  losses: number;
  winRate: number | null; // null when no decided bets in band
  pnl: number;
}

export interface LeagueRow {
  league: string;
  count: number;
  pnl: number;
}

export interface StatsSummary {
  totalBets: number;
  settledCount: number;
  wins: number;
  losses: number;
  cashouts: number;
  voids: number;
  openCount: number;

  totalWagered: number;
  totalReturned: number;
  netPnl: number;
  roi: number | null; // null when nothing wagered
  winRate: number | null; // W / (W + L), cash-outs excluded

  openStake: number;
  openPotentialPayout: number;

  cumulative: { t: number; pnl: number }[];
  monthly: { month: string; pnl: number; count: number }[];
  oddsBands: OddsBand[];

  longestWinStreak: number;
  longestLossStreak: number;

  leagues: LeagueRow[]; // sorted by pnl desc

  records: {
    biggestWin: BetRef | null;
    longestOdds: BetRef | null;
    biggestStake: BetRef | null;
    bestParlay: BetRef | null;
    dreamParlay: BetRef | null; // lost parlay w/ highest potential payout (only when bestParlay is null)
  };

  parlaysAttempted: number;
  parlaysWon: number;

  firstBetAt: number | null;
  lastBetAt: number | null;
}
