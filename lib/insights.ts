// StatsSummary → actionable insights ("The Read"). Pure, rule-based, no
// React. Leaks (what's costing you) come first, then edges (what's working),
// then notes (discipline/pacing observations). Max 5.

import type { StatsSummary } from "./types";
import { money, pct, signedMoney } from "./format";

export interface Insight {
  kind: "leak" | "edge" | "note";
  title: string;
  body: string;
}

const PARLAY_BUCKET = "Parlays / Other";

export function generateInsights(s: StatsSummary): Insight[] {
  const leaks: Insight[] = [];
  const edges: Insight[] = [];
  const notes: Insight[] = [];

  // --- Parlays
  if (s.parlaysAttempted >= 8) {
    const hitRate = s.parlaysWon / s.parlaysAttempted;
    const bucket = s.leagues.find((l) => l.league === PARLAY_BUCKET);
    if (bucket && bucket.pnl < 0 && hitRate < 0.2) {
      const share =
        s.netPnl < 0 ? Math.round((bucket.pnl / s.netPnl) * 100) : null;
      leaks.push({
        kind: "leak",
        title: "Cut the parlays",
        body: `${s.parlaysAttempted} parlays, ${s.parlaysWon} ${
          s.parlaysWon === 1 ? "hit" : "hits"
        } (${pct(hitRate)}). They've cost you ${money(Math.abs(bucket.pnl))}${
          share !== null && share >= 20
            ? ` — ${share}% of everything you're down`
            : ""
        }. Singles give the same sweat with far better math.`,
      });
    }
  }

  // --- Odds bands
  const decided = s.oddsBands.filter((b) => b.count >= 8);
  const worstBand = decided.reduce(
    (worst, b) => (b.pnl < (worst?.pnl ?? 0) ? b : worst),
    null as (typeof decided)[number] | null
  );
  if (worstBand && worstBand.pnl < -25) {
    leaks.push({
      kind: "leak",
      title: `Long odds are a tax (${worstBand.label})`,
      body: `${worstBand.count} bets at ${worstBand.label} odds, ${
        worstBand.winRate !== null ? pct(worstBand.winRate) : "—"
      } win rate, ${signedMoney(worstBand.pnl)}. The longer the odds, the more the house likes you.`,
    });
  }
  const bestBand = decided.reduce(
    (best, b) => (b.pnl > (best?.pnl ?? 0) ? b : best),
    null as (typeof decided)[number] | null
  );
  if (bestBand && bestBand.pnl > 0 && bestBand.winRate !== null) {
    edges.push({
      kind: "edge",
      title: `Your edge lives at ${bestBand.label} odds`,
      body: `${pct(bestBand.winRate)} win rate and ${signedMoney(bestBand.pnl)} over ${bestBand.count} bets — the band where you actually beat the book. More of this.`,
    });
  }

  // --- Leagues (excluding the parlay bucket, already covered)
  const realLeagues = s.leagues.filter((l) => l.league !== PARLAY_BUCKET);
  const worstLeague = realLeagues[realLeagues.length - 1];
  if (worstLeague && worstLeague.pnl < -50 && worstLeague.count >= 8) {
    leaks.push({
      kind: "leak",
      title: `${worstLeague.league} is your money pit`,
      body: `${signedMoney(worstLeague.pnl)} across ${worstLeague.count} bets. Whatever you think you know about ${worstLeague.league}, the results disagree.`,
    });
  }
  const bestLeague = realLeagues[0];
  if (bestLeague && bestLeague.pnl > 20 && bestLeague.count >= 5) {
    edges.push({
      kind: "edge",
      title: `You're actually good at ${bestLeague.league}`,
      body: `${signedMoney(bestLeague.pnl)} over ${bestLeague.count} bets. If you're going to bet, this is where your judgment holds up.`,
    });
  }

  // --- Discipline / streaks
  if (s.longestLossStreak >= 15) {
    notes.push({
      kind: "note",
      title: `${s.longestLossStreak} losses in a row`,
      body: `Nobody makes good decisions ${s.longestLossStreak} bets deep into a skid. A hard stop rule — three straight losses, done for the day — would have saved real money.`,
    });
  }

  // --- Stake sizing
  const avgStake = s.settledCount > 0 ? s.totalWagered / s.settledCount : 0;
  const big = s.records.biggestStake;
  if (big && avgStake > 0 && big.wager >= avgStake * 4) {
    notes.push({
      kind: "note",
      title: "Watch the stake spikes",
      body: `Your average bet is ${money(avgStake)}, but you've gone as high as ${money(big.wager)} — ${Math.round(big.wager / avgStake)}× your normal size. Spikes like that are usually chasing, not conviction.`,
    });
  }

  // --- Run rate
  if (s.monthly.length >= 3 && s.netPnl < 0) {
    const perMonth = s.netPnl / s.monthly.length;
    if (perMonth < -5) {
      notes.push({
        kind: "note",
        title: "Your run rate",
        body: `Averaged out, this habit costs about ${money(Math.abs(perMonth))} a month. That's the honest subscription price of the sweat.`,
      });
    }
  }

  // --- Profitable overall
  if (s.netPnl > 0) {
    edges.push({
      kind: "edge",
      title: "You're beating the book — rare air",
      body: `${signedMoney(s.netPnl)} lifetime${
        s.roi !== null ? ` at ${pct(s.roi)} ROI` : ""
      }. Protect it: flat stakes and the bands/leagues that got you here.`,
    });
  }

  return [...leaks, ...edges, ...notes].slice(0, 5);
}
