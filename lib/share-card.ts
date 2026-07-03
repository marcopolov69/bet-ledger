// Renders a 1080×1350 (4:5, Instagram portrait) share card from a
// StatsSummary, drawn entirely on a client-side <canvas> — nothing leaves
// the browser. Layout: hero slip with net P&L + stamp on top, then the
// record bets (biggest win / parlay / biggest stake) as mini slips below.

import type { BetRef, StatsSummary } from "./types";
import { americanOdds, money, pct, shortDate, signedMoney } from "./format";

const W = 1080;
const H = 1350;

const BG = "#101418";
const PAPER = "#f2ecda";
const PAPER_INK = "#211f18";
const PAPER_DIM = "#77715c";
const RED = "#c0331d";
const GREEN = "#1e7d4b";
const AMBER = "#9c6b1c";

const SITE = "bet-ledger-mu.vercel.app";

function fontFamilies() {
  const css = getComputedStyle(document.documentElement);
  return {
    display: css.getPropertyValue("--font-saira").trim() || "sans-serif",
    mono: css.getPropertyValue("--font-plex-mono").trim() || "monospace",
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t.trimEnd() + "…";
}

function paperCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  roundRect(ctx, x, y, w, h, 12);
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, "#f7f2e3");
  grad.addColorStop(0.4, PAPER);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

interface MiniCard {
  title: string;
  bet: BetRef;
  value: string;
  valueColor: string;
}

function drawMiniSlip(
  ctx: CanvasRenderingContext2D,
  card: MiniCard,
  x: number,
  y: number,
  w: number,
  h: number,
  rot: number,
  fonts: { display: string; mono: string }
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.translate(-(x + w / 2), -(y + h / 2));

  paperCard(ctx, x, y, w, h);

  const padX = 44;

  // title + date
  ctx.textAlign = "left";
  ctx.letterSpacing = "4px";
  ctx.font = `700 22px ${fonts.mono}`;
  ctx.fillStyle = PAPER_DIM;
  ctx.fillText(card.title, x + padX, y + 46);
  ctx.textAlign = "right";
  ctx.font = `400 22px ${fonts.mono}`;
  ctx.fillText(
    shortDate(card.bet.placedAt).toUpperCase(),
    x + w - padX,
    y + 46
  );
  ctx.letterSpacing = "0px";

  // big value + status
  ctx.textAlign = "left";
  ctx.font = `800 58px ${fonts.display}`;
  ctx.fillStyle = card.valueColor;
  ctx.fillText(card.value, x + padX, y + 112);

  ctx.textAlign = "right";
  ctx.letterSpacing = "3px";
  ctx.font = `700 24px ${fonts.mono}`;
  ctx.fillStyle = PAPER_DIM;
  ctx.fillText(card.bet.status.toUpperCase(), x + w - padX, y + 112);
  ctx.letterSpacing = "0px";

  // match — market (left) · stake (right)
  ctx.textAlign = "right";
  ctx.font = `400 24px ${fonts.mono}`;
  ctx.fillStyle = PAPER_DIM;
  const stake = `${money(card.bet.wager)}${
    card.bet.price != null
      ? ` · ${card.bet.price.toFixed(2)} (${americanOdds(card.bet.price)})`
      : ""
  }`;
  const stakeW = ctx.measureText(stake).width;
  ctx.fillText(stake, x + w - padX, y + 156);

  ctx.textAlign = "left";
  ctx.font = `600 26px ${fonts.mono}`;
  ctx.fillStyle = PAPER_INK;
  const desc =
    card.bet.match && card.bet.market && card.bet.market !== "MULTIPLE"
      ? `${card.bet.match} — ${card.bet.market}`
      : card.bet.match || card.bet.market;
  ctx.fillText(
    truncate(ctx, desc, w - padX * 2 - stakeW - 32),
    x + padX,
    y + 156
  );

  ctx.restore();
}

export async function renderShareCard(stats: StatsSummary): Promise<Blob> {
  const fonts = fontFamilies();
  const { display, mono } = fonts;

  await Promise.all(
    [
      `800 150px ${display}`,
      `800 58px ${display}`,
      `700 44px ${display}`,
      `700 24px ${mono}`,
      `600 32px ${mono}`,
      `400 24px ${mono}`,
    ].map((f) => document.fonts.load(f))
  ).catch(() => {});

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const negative = stats.netPnl < 0;

  // ---- lounge background with a soft vignette
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -100, 50, W / 2, -100, 1000);
  glow.addColorStop(0, "rgba(26,40,51,0.9)");
  glow.addColorStop(1, "rgba(26,40,51,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ---- hero slip
  const SX = 56,
    SY = 56,
    SW = W - 112,
    SH = 660;
  paperCard(ctx, SX, SY, SW, SH);

  // faint paper grain
  ctx.save();
  roundRect(ctx, SX, SY, SW, SH, 12);
  ctx.clip();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = "#5a5340";
  for (let i = 0; i < 700; i++) {
    const a = Math.sin(i * 127.1) * 43758.5453;
    const b = Math.sin(i * 269.5) * 28001.8384;
    ctx.fillRect(
      SX + (a - Math.floor(a)) * SW,
      SY + (b - Math.floor(b)) * SH,
      2,
      2
    );
  }
  ctx.restore();

  // header
  ctx.letterSpacing = "5px";
  ctx.font = `700 24px ${mono}`;
  ctx.fillStyle = PAPER_DIM;
  ctx.textAlign = "left";
  ctx.fillText("BETLEDGER · OFFICIAL LEDGER", SX + 56, SY + 76);
  if (stats.firstBetAt !== null && stats.lastBetAt !== null) {
    ctx.font = `400 22px ${mono}`;
    ctx.fillText(
      `${shortDate(stats.firstBetAt)} — ${shortDate(stats.lastBetAt)}`.toUpperCase(),
      SX + 56,
      SY + 112
    );
  }
  ctx.letterSpacing = "0px";

  // big net number
  ctx.letterSpacing = "4px";
  ctx.font = `700 26px ${mono}`;
  ctx.fillStyle = PAPER_DIM;
  ctx.textAlign = "center";
  ctx.fillText("ALL-TIME NET PROFIT / LOSS", W / 2, SY + 224);
  ctx.letterSpacing = "0px";
  ctx.font = `800 150px ${display}`;
  ctx.fillStyle = negative ? RED : GREEN;
  ctx.fillText(signedMoney(stats.netPnl), W / 2, SY + 360);

  // 4-up stats row
  const cols = [
    { label: "WAGERED", value: money(stats.totalWagered) },
    { label: "RETURNED", value: money(stats.totalReturned) },
    { label: "ROI", value: stats.roi !== null ? pct(stats.roi) : "—" },
    {
      label: "RECORD",
      value: `${stats.wins}–${stats.losses}–${stats.cashouts}`,
    },
  ];
  cols.forEach((c, i) => {
    const cx = SX + (SW / 8) * (2 * i + 1);
    ctx.letterSpacing = "3px";
    ctx.font = `700 20px ${mono}`;
    ctx.fillStyle = PAPER_DIM;
    ctx.fillText(c.label, cx, SY + 442);
    ctx.letterSpacing = "0px";
    ctx.font = `600 32px ${mono}`;
    ctx.fillStyle = PAPER_INK;
    ctx.fillText(c.value, cx, SY + 484);
  });

  // perforation
  const perfY = SY + 528;
  ctx.strokeStyle = "rgba(33,31,24,0.3)";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(SX + 30, perfY);
  ctx.lineTo(SX + SW - 30, perfY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = BG;
  for (const nx of [SX, SX + SW]) {
    ctx.beginPath();
    ctx.arc(nx, perfY, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // condensed stat line under the perforation
  const bits: string[] = [];
  if (stats.winRate !== null) bits.push(`WIN RATE ${pct(stats.winRate)}`);
  bits.push(`${stats.longestWinStreak}W HOT / ${stats.longestLossStreak}L COLD`);
  if (stats.parlaysAttempted > 0)
    bits.push(`PARLAYS ${stats.parlaysWon} OF ${stats.parlaysAttempted}`);
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  ctx.font = `700 24px ${mono}`;
  ctx.fillStyle = PAPER_DIM;
  ctx.fillText(bits.join("  ·  "), W / 2, perfY + 52);
  ctx.letterSpacing = "0px";

  // barcode + site footer inside the hero slip
  const bcY = SY + SH - 64;
  ctx.fillStyle = PAPER_INK;
  const widths = [4, 2, 6, 3, 2, 5, 2, 3, 6, 2, 4, 2, 5, 3, 2, 6, 3, 2, 4, 5, 2, 3, 2, 6, 4, 2, 3, 5, 2, 4];
  let bx = SX + 56;
  for (let i = 0; i < widths.length; i++) {
    ctx.fillRect(bx, bcY, widths[i], 38);
    bx += widths[i] + (i % 3 === 0 ? 7 : 4);
  }
  ctx.textAlign = "right";
  ctx.letterSpacing = "3px";
  ctx.font = `700 22px ${mono}`;
  ctx.fillStyle = PAPER_DIM;
  ctx.fillText(`${stats.settledCount} BETS GRADED AT`, SX + SW - 56, bcY + 10);
  ctx.fillStyle = PAPER_INK;
  ctx.fillText(SITE.toUpperCase(), SX + SW - 56, bcY + 38);
  ctx.letterSpacing = "0px";

  // rubber stamp, top-right of hero slip
  ctx.save();
  ctx.translate(W - 290, SY + 140);
  ctx.rotate((15 * Math.PI) / 180);
  ctx.globalAlpha = 0.85;
  const stampColor = negative ? RED : GREEN;
  const text = negative ? "HOUSE WINS" : "PRINTING MONEY";
  ctx.font = `700 44px ${display}`;
  ctx.letterSpacing = "6px";
  const tw = ctx.measureText(text).width;
  const pad = 26;
  ctx.strokeStyle = stampColor;
  ctx.lineWidth = 7;
  roundRect(ctx, -tw / 2 - pad, -46, tw + pad * 2, 92, 10);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  roundRect(ctx, -tw / 2 - pad - 9, -55, tw + pad * 2 + 18, 110, 14);
  ctx.stroke();
  ctx.fillStyle = stampColor;
  ctx.textAlign = "center";
  ctx.fillText(text, 0, 16);
  ctx.letterSpacing = "0px";
  ctx.restore();

  // ---- record bets as mini slips
  const minis: MiniCard[] = [];
  const r = stats.records;
  if (r.biggestWin)
    minis.push({
      title: "BIGGEST WIN",
      bet: r.biggestWin,
      value: signedMoney(r.biggestWin.pnl),
      valueColor: GREEN,
    });
  if (r.bestParlay)
    minis.push({
      title: "BEST PARLAY HIT",
      bet: r.bestParlay,
      value: signedMoney(r.bestParlay.pnl),
      valueColor: GREEN,
    });
  else if (r.dreamParlay)
    minis.push({
      title: "CLOSEST DREAM PARLAY",
      bet: r.dreamParlay,
      value: money(r.dreamParlay.potentialPayout ?? 0),
      valueColor: RED,
    });
  else if (r.longestOdds && r.longestOdds.price != null)
    minis.push({
      title: "LONGEST ODDS CASHED",
      bet: r.longestOdds,
      value: r.longestOdds.price.toFixed(2),
      valueColor: AMBER,
    });
  if (r.biggestStake)
    minis.push({
      title: "BIGGEST STAKE",
      bet: r.biggestStake,
      value: money(r.biggestStake.wager),
      valueColor: r.biggestStake.pnl < 0 ? RED : GREEN,
    });

  const MY = 772; // first mini card top
  const MH = 168;
  const GAP = 22;
  const rots = [-0.5, 0.45, -0.35];
  minis.slice(0, 3).forEach((card, i) => {
    drawMiniSlip(
      ctx,
      card,
      SX,
      MY + i * (MH + GAP),
      SW,
      MH,
      rots[i % rots.length],
      fonts
    );
  });

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas export failed"))),
      "image/png"
    )
  );
}
