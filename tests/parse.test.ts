import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseBets,
  parseHardRockDate,
  parseNumber,
  sanitizeXml,
  ParseError,
} from "../lib/parse";

const fixture = readFileSync(
  join(__dirname, "fixtures", "All_Bets_Export_fixture.xls"),
  "utf-8"
);

describe("sanitizeXml", () => {
  it("escapes bare ampersands but leaves entities alone", () => {
    expect(sanitizeXml("First Half & Game Winner")).toBe(
      "First Half &amp; Game Winner"
    );
    expect(sanitizeXml("a &amp; b &lt; c &#38; d &#x26; e")).toBe(
      "a &amp; b &lt; c &#38; d &#x26; e"
    );
  });
});

describe("parseNumber", () => {
  it('treats "null", empty, and missing as null', () => {
    expect(parseNumber("null")).toBeNull();
    expect(parseNumber("")).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
    expect(parseNumber("25.00")).toBe(25);
    expect(parseNumber("-7.50")).toBe(-7.5);
  });
});

describe("parseHardRockDate", () => {
  it('parses "2 Jul 2026 @ 11:35am"', () => {
    const t = parseHardRockDate("2 Jul 2026 @ 11:35am");
    expect(t).not.toBeNull();
    const d = new Date(t!);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(2);
    expect(d.getHours()).toBe(11);
    expect(d.getMinutes()).toBe(35);
  });

  it("handles pm and 12am/12pm edge cases", () => {
    expect(new Date(parseHardRockDate("1 Jan 2026 @ 7:05pm")!).getHours()).toBe(19);
    expect(new Date(parseHardRockDate("1 Jan 2026 @ 12:00am")!).getHours()).toBe(0);
    expect(new Date(parseHardRockDate("1 Jan 2026 @ 12:00pm")!).getHours()).toBe(12);
  });

  it("rejects garbage", () => {
    expect(parseHardRockDate("2026-07-02T11:35:00Z")).toBeNull();
  });
});

describe("parseBets", () => {
  const bets = parseBets(fixture);

  it("finds 6 parent bets (leg rows are not counted as bets)", () => {
    expect(bets).toHaveLength(6);
  });

  it("parses the winning single correctly", () => {
    const b = bets[0];
    expect(b.status).toBe("Won");
    expect(b.league).toBe("NBA, Regular");
    expect(b.price).toBe(2.5);
    expect(b.wager).toBe(10);
    expect(b.payout).toBe(25);
    expect(b.betSlipId).toBe("A1000001");
    expect(b.isParlay).toBe(false);
    expect(b.legs).toHaveLength(0);
  });

  it('treats string "null" payout as null on the lost bet', () => {
    const lost = bets[1];
    expect(lost.status).toBe("Lost");
    expect(lost.payout).toBeNull();
  });

  it("parses the cash-out with negative winnings", () => {
    const co = bets[2];
    expect(co.status).toBe("Cashed Out");
    expect(co.winnings).toBe(-7.5);
    expect(co.payout).toBe(22.5);
  });

  it("attaches 3 leg rows to the parlay parent, never as separate bets", () => {
    const parlay = bets[4];
    expect(parlay.isParlay).toBe(true);
    expect(parlay.betType).toBe("MULTIPLE");
    expect(parlay.legs).toHaveLength(3);
    expect(parlay.legs[0].status).toBe("Win");
    expect(parlay.legs[1].status).toBe("Lose");
    expect(parlay.legs[0].match).toBe(
      "Los Angeles Lakers vs Golden State Warriors"
    );
  });

  it("survives the unescaped ampersand in a leg market name", () => {
    const parlay = bets[4];
    expect(parlay.legs[0].market).toBe("First Half & Game Winner Parlay");
  });

  it("parses the open bet with null payout and a potential payout", () => {
    const open = bets[5];
    expect(open.status).toBe("Open");
    expect(open.payout).toBeNull();
    expect(open.potentialPayout).toBe(60);
  });

  it("locates columns by header name even when column order changes", () => {
    // Swap Wager and Price header positions AND their data cells by
    // rebuilding a two-column-swapped copy of the fixture.
    const swapped = fixture
      .replace(
        "<Cell><Data ss:Type=\"String\">Price</Data></Cell>\n    <Cell><Data ss:Type=\"String\">Wager</Data></Cell>",
        "<Cell><Data ss:Type=\"String\">Wager</Data></Cell>\n    <Cell><Data ss:Type=\"String\">Price</Data></Cell>"
      );
    const swappedBets = parseBets(swapped);
    // Header says col 7 is Wager now, so the first bet's "2.50" cell is wager.
    expect(swappedBets[0].wager).toBe(2.5);
    expect(swappedBets[0].price).toBe(10);
  });

  it("rejects a file that is not a Hard Rock export", () => {
    expect(() => parseBets("<html><body>hello</body></html>")).toThrow(
      ParseError
    );
    expect(() => parseBets("just some text")).toThrow(ParseError);
  });
});
