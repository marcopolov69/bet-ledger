// Parser for the Hard Rock Bet "All_Bets_Export.xls" file.
//
// The file is NOT a real Excel binary — it's SpreadsheetML 2003: plain UTF-8
// XML (namespace urn:schemas-microsoft-com:office:spreadsheet). We parse it
// with regexes instead of DOMParser so this module is pure and runs
// identically in the browser (Phase 1) and on the server (Phase 2).

import type { Bet, BetLeg, ParentStatus } from "./types";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

const NOT_AN_EXPORT_MSG =
  "This doesn't look like a Hard Rock bet export — go to Account → Bet History → Export in the Hard Rock app, then drop the All_Bets_Export.xls file here.";

/**
 * Hard Rock emits unescaped ampersands in market names
 * (e.g. "First Half & Game Winner Parlay"), which breaks strict XML.
 * Escape any & that isn't already part of an entity.
 */
export function sanitizeXml(text: string): string {
  return text.replace(
    /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g,
    "&amp;"
  );
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** "null", empty, and missing all mean null. Strips $ and , just in case. */
export function parseNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const v = raw.trim();
  if (v === "" || v.toLowerCase() === "null") return null;
  const n = Number(v.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Date format: "2 Jul 2026 @ 11:35am". Don't trust Date.parse. */
export function parseHardRockDate(raw: string): number | null {
  const m = raw
    .trim()
    .match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s*@\s*(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!m) return null;
  const [, day, mon, year, hourRaw, min, ampm] = m;
  const month = MONTHS[mon.toLowerCase()];
  if (month === undefined) return null;
  let hour = parseInt(hourRaw, 10) % 12;
  if (ampm.toLowerCase() === "pm") hour += 12;
  return new Date(
    parseInt(year, 10), month, parseInt(day, 10), hour, parseInt(min, 10)
  ).getTime();
}

/** Extract each <Row>'s cell texts, honoring ss:Index gaps. */
function extractRows(xml: string): string[][] {
  const rows: string[][] = [];
  const rowRe = /<Row\b[^>]*>([\s\S]*?)<\/Row>/g;
  const cellRe = /<Cell\b([^>]*)\/>|<Cell\b([^>]*)>([\s\S]*?)<\/Cell>/g;
  const dataRe = /<Data\b[^>]*>([\s\S]*?)<\/Data>/;

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(xml)) !== null) {
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      const attrs = cellMatch[1] ?? cellMatch[2] ?? "";
      const inner = cellMatch[3] ?? "";
      // ss:Index is 1-based; a gap means empty cells were skipped.
      const idxMatch = attrs.match(/ss:Index="(\d+)"/);
      if (idxMatch) {
        const target = parseInt(idxMatch[1], 10) - 1;
        while (cells.length < target) cells.push("");
      }
      const dataMatch = inner.match(dataRe);
      cells.push(dataMatch ? decodeEntities(dataMatch[1]).trim() : "");
    }
    rows.push(cells);
  }
  return rows;
}

const REQUIRED_HEADERS = [
  "Date Placed", "Status", "League", "Match", "Bet Type", "Market",
  "Price", "Wager", "Winnings", "Payout", "Potential Payout", "Result",
  "Bet Slip ID",
];

/**
 * Parse the raw text of an All_Bets_Export file into Bet[].
 * Throws ParseError with a user-friendly message when the file isn't a
 * Hard Rock export.
 */
export function parseBets(rawText: string): Bet[] {
  const text = rawText.replace(/^﻿/, "");

  // Sniff content, not extension: reject binaries / non-spreadsheet files early.
  if (!text.includes("<") || text.slice(0, 1024).includes("\u0000")) {
    throw new ParseError(NOT_AN_EXPORT_MSG);
  }

  const rows = extractRows(sanitizeXml(text));

  // Locate the header row and build a name → index map (column order may change).
  const headerRowIdx = rows.findIndex((r) => r.includes("Date Placed"));
  if (headerRowIdx === -1) {
    throw new ParseError(NOT_AN_EXPORT_MSG);
  }
  const headerRow = rows[headerRowIdx];
  const col: Record<string, number> = {};
  for (const h of REQUIRED_HEADERS) {
    const idx = headerRow.indexOf(h);
    if (idx === -1 && (h === "Date Placed" || h === "Status" || h === "Wager")) {
      throw new ParseError(NOT_AN_EXPORT_MSG);
    }
    col[h] = idx;
  }

  const bets: Bet[] = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.every((c) => c === "")) continue;

    const get = (header: string, shift = 0): string => {
      const idx = col[header];
      if (idx === undefined || idx === -1) return "";
      return cells[idx + shift] ?? "";
    };

    const firstCell = cells[col["Date Placed"]] ?? "";

    if (firstCell !== "") {
      // Parent bet row (13 cells).
      const datePlacedRaw = get("Date Placed");
      const placedAt = parseHardRockDate(datePlacedRaw);
      if (placedAt === null) continue; // not a bet row (stray metadata)

      const betType = get("Bet Type");
      const market = get("Market");
      bets.push({
        datePlacedRaw,
        placedAt,
        status: get("Status") as ParentStatus,
        league: get("League"),
        match: get("Match"),
        betType,
        market,
        price: parseNumber(get("Price")),
        wager: parseNumber(get("Wager")),
        winnings: parseNumber(get("Winnings")),
        payout: parseNumber(get("Payout")),
        potentialPayout: parseNumber(get("Potential Payout")),
        result: get("Result"),
        betSlipId: get("Bet Slip ID"),
        isParlay: betType === "MULTIPLE" || market === "MULTIPLE",
        legs: [],
      });
    } else {
      // Parlay leg row (14 cells, shifted right by one). Attach to the
      // preceding parent; never count in money math.
      const parent = bets[bets.length - 1];
      if (!parent) continue;
      const leg: BetLeg = {
        status: get("Status", 1),
        league: get("League", 1),
        match: get("Match", 1),
        betType: get("Bet Type", 1),
        market: get("Market", 1),
        price: parseNumber(get("Price", 1)),
        result: get("Result", 1),
      };
      if (leg.match === "" && leg.market === "") continue;
      parent.legs.push(leg);
    }
  }

  if (bets.length === 0) {
    throw new ParseError(
      "We found the export format but no bets inside it. If your bet history isn't empty, try re-exporting from the Hard Rock app."
    );
  }

  return bets;
}
