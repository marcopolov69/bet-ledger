// Renders a 1080×1080 Instagram-ready share card from a StatsSummary,
// drawn entirely on a client-side <canvas> — nothing leaves the browser.

import type { StatsSummary } from "./types";
import { americanOdds, money, pct, shortDate, signedMoney } from "./format";

const W = 1080;
const H = 1080;

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

export async function renderShareCard(stats: StatsSummary): Promise<Blob> {
  const { display, mono } = fontFamilies();

  await Promise.all(
    [
      `800 168px ${display}`,
      `700 44px ${display}`,
      `700 30px ${mono}`,
      `600 34px ${mono}`,
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
  const glow = ctx.createRadialGradient(W / 2, -100, 50, W / 2, -100, 900);
  glow.addColorStop(0, "rgba(26,40,51,0.9)");
  glow.addColorStop(1, "rgba(26,40,51,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ---- paper slip
  const SX = 64,
    SY = 64,
    SW = W - 128,
    SH = H - 128;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  roundRect(ctx, SX, SY, SW, SH, 12);
  const paperGrad = ctx.createLinearGradient(0, SY, 0, SY + SH);
  paperGrad.addColorStop(0, "#f7f2e3");
  paperGrad.addColorStop(0.35, PAPER);
  ctx.fillStyle = paperGrad;
  ctx.fill();
  ctx.restore();

  // faint paper grain (cheap dither)
  ctx.save();
  roundRect(ctx, SX, SY, SW, SH, 12);
  ctx.clip();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = "#5a5340";
  for (let i = 0; i < 900; i++) {
    // deterministic pseudo-random speckle
    const a = Math.sin(i * 127.1) * 43758.5453;
    const b = Math.sin(i * 269.5) * 28001.8384;
    const x = SX + (a - Math.floor(a)) * SW;
    const y = SY + (b - Math.floor(b)) * SH;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  // ---- header
  ctx.letterSpacing = "5px";
  ctx.font = `700 24px ${mono}`;
  ctx.fillStyle = PAPER_DIM;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillText("BETLEDGER · OFFICIAL LEDGER", SX + 56, SY + 84);

  if (stats.firstBetAt !== null && stats.lastBetAt !== null) {
    ctx.font = `400 22px ${mono}`;
    ctx.fillText(
      `${shortDate(stats.firstBetAt)} — ${shortDate(stats.lastBetAt)}`.toUpperCase(),
      SX + 56,
      SY + 124
    );
  }
  ctx.letterSpacing = "0px";

  // ---- big net number
  ctx.letterSpacing = "4px";
  ctx.font = `700 26px ${mono}`;
  ctx.fillStyle = PAPER_DIM;
  ctx.textAlign = "center";
  ctx.fillText("ALL-TIME NET PROFIT / LOSS", W / 2, 318);
  ctx.letterSpacing = "0px";

  ctx.font = `800 168px ${display}`;
  ctx.fillStyle = negative ? RED : GREEN;
  ctx.fillText(signedMoney(stats.netPnl), W / 2, 470);

  // ---- 4-up stats row
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
    ctx.fillText(c.label, cx, 560);
    ctx.letterSpacing = "0px";
    ctx.font = `600 32px ${mono}`;
    ctx.fillStyle = PAPER_INK;
    ctx.fillText(c.value, cx, 604);
  });

  // ---- perforation
  const perfY = 662;
  ctx.strokeStyle = "rgba(33,31,24,0.3)";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(SX + 30, perfY);
  ctx.lineTo(SX + SW - 30, perfY);
  ctx.stroke();
  ctx.setLineDash([]);
  // punched notches
  ctx.fillStyle = BG;
  for (const nx of [SX, SX + SW]) {
    ctx.beginPath();
    ctx.arc(nx, perfY, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- receipt lines (the interesting stuff)
  const lines: { label: string; value: string; color?: string }[] = [];
  if (stats.records.biggestWin)
    lines.push({
      label: "BIGGEST WIN",
      value: signedMoney(stats.records.biggestWin.pnl),
      color: GREEN,
    });
  if (stats.records.longestOdds?.price != null)
    lines.push({
      label: "LONGEST ODDS CASHED",
      value: `${stats.records.longestOdds.price.toFixed(2)} (${americanOdds(stats.records.longestOdds.price)})`,
      color: AMBER,
    });
  if (stats.winRate !== null)
    lines.push({ label: "WIN RATE", value: pct(stats.winRate) });
  lines.push({
    label: "STREAKS",
    value: `${stats.longestWinStreak}W HOT · ${stats.longestLossStreak}L COLD`,
    color: stats.longestLossStreak > stats.longestWinStreak ? RED : GREEN,
  });
  if (stats.parlaysAttempted > 0)
    lines.push({
      label: "PARLAYS HIT",
      value: `${stats.parlaysWon} OF ${stats.parlaysAttempted}`,
      color: stats.parlaysWon === 0 ? RED : GREEN,
    });
  if (stats.records.biggestStake)
    lines.push({
      label: "BIGGEST STAKE",
      value: `${money(stats.records.biggestStake.wager)} (${stats.records.biggestStake.status.toUpperCase()})`,
    });

  let ly = perfY + 68;
  for (const line of lines.slice(0, 5)) {
    ctx.textAlign = "left";
    ctx.letterSpacing = "3px";
    ctx.font = `400 26px ${mono}`;
    ctx.fillStyle = PAPER_DIM;
    ctx.fillText(line.label, SX + 56, ly);
    const labelW = ctx.measureText(line.label).width;
    ctx.letterSpacing = "0px";

    ctx.textAlign = "right";
    ctx.font = `700 28px ${mono}`;
    ctx.fillStyle = line.color ?? PAPER_INK;
    ctx.fillText(line.value, SX + SW - 56, ly);
    const valueW = ctx.measureText(line.value).width;

    // dot leaders
    ctx.strokeStyle = "rgba(33,31,24,0.25)";
    ctx.lineWidth = 3;
    ctx.setLineDash([3, 10]);
    ctx.beginPath();
    ctx.moveTo(SX + 56 + labelW + 24, ly - 8);
    ctx.lineTo(SX + SW - 56 - valueW - 24, ly - 8);
    ctx.stroke();
    ctx.setLineDash([]);

    ly += 46;
  }

  // ---- footer: barcode + site
  const bcY = SY + SH - 64;
  ctx.fillStyle = PAPER_INK;
  const widths = [4, 2, 6, 3, 2, 5, 2, 3, 6, 2, 4, 2, 5, 3, 2, 6, 3, 2, 4, 5, 2, 3, 2, 6, 4, 2, 3, 5, 2, 4];
  let bx = SX + 56;
  for (let i = 0; i < widths.length; i++) {
    ctx.fillRect(bx, bcY, widths[i], 40);
    bx += widths[i] + (i % 3 === 0 ? 7 : 4);
  }
  ctx.textAlign = "right";
  ctx.letterSpacing = "3px";
  ctx.font = `700 22px ${mono}`;
  ctx.fillStyle = PAPER_DIM;
  ctx.fillText(`${stats.settledCount} BETS GRADED AT`, SX + SW - 56, bcY + 12);
  ctx.fillStyle = PAPER_INK;
  ctx.fillText(SITE.toUpperCase(), SX + SW - 56, bcY + 40);
  ctx.letterSpacing = "0px";

  // ---- rubber stamp, top-right, slightly rotated
  ctx.save();
  ctx.translate(W - 300, 190);
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

  ctx.restore(); // slip clip

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas export failed"))),
      "image/png"
    )
  );
}
