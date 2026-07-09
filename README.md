# BurryApp

Drop in your Hard Rock Bet `All_Bets_Export.xls` and instantly see your all-time betting stats: total wagered, profit/loss, records, and charts.

**Graded instantly in your browser — no account needed.** Graded exports and their
summary stats are archived anonymously to Vercel Blob (`/api/submissions`) to power
upcoming features like the leaderboard.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000 and drop in your export file
(get it in the Hard Rock app: **Account → Bet History → Export**).

## Run the tests

```bash
npm test
```

The parser and stats engine (`lib/parse.ts`, `lib/stats.ts`) are pure functions
tested against a fixture export in `tests/fixtures/`.

## Deploy to Vercel (free)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com), sign up with GitHub, click **Add New → Project**, pick this repo, and click **Deploy**. That's it — Vercel auto-detects Next.js.

Every `git push` after that redeploys automatically.

## Architecture notes (Phase 2 ready)

- `lib/parse.ts` — Hard Rock export (SpreadsheetML 2003 XML) → `Bet[]`. Pure, regex-based, no browser APIs, so the same code can run server-side later.
- `lib/stats.ts` — `Bet[]` → `StatsSummary`, a flat serializable JSON object. This exact object is the future leaderboard payload.
- Phase 2 (leaderboard) bolts on as an API route that re-runs these same modules server-side — no rewrite needed.
