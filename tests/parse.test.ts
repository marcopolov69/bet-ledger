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

describe("parseBets (real namespaced format)", () => {
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

  it("attaches 3 unshifted leg rows to the parlay parent", () => {
    const parlay = bets[4];
    expect(parlay.isParlay).toBe(true);
    expect(parlay.betType).toBe("MULTIPLE");
    expect(parlay.legs).toHaveLength(3);
    expect(parlay.legs[0].status).toBe("Win");
    expect(parlay.legs[1].status).toBe("Lose");
    expect(parlay.legs[0].match).toBe(
      "Los Angeles Lakers vs Golden State Warriors"
    );
    expect(parlay.legs[0].market).toBe("Lakers / Lakers");
    expect(parlay.legs[0].price).toBe(2.2);
  });

  it("survives the unescaped ampersand in a leg bet type", () => {
    const parlay = bets[4];
    expect(parlay.legs[0].betType).toBe("First Half & Game Winner Parlay");
  });

  it("parses the open bet with null payout and a potential payout", () => {
    const open = bets[5];
    expect(open.status).toBe("Open");
    expect(open.payout).toBeNull();
    expect(open.potentialPayout).toBe(60);
  });

  it("locates columns by header name even when column order changes", () => {
    const priceHeader =
      '  <ss:Cell>\n    <ss:Data ss:Type="String">Price</ss:Data>\n  </ss:Cell>\n';
    const wagerHeader =
      '  <ss:Cell>\n    <ss:Data ss:Type="String">Wager</ss:Data>\n  </ss:Cell>\n';
    const swapped = fixture.replace(
      priceHeader + wagerHeader,
      wagerHeader + priceHeader
    );
    expect(swapped).not.toBe(fixture);
    const swappedBets = parseBets(swapped);
    // Header now says col 7 is Wager, so the first bet's "2.50" cell is wager.
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

describe("parseBets (format variants)", () => {
  it("parses bare (non-namespaced) tags too", () => {
    const bare = fixture
      .replace(/<ss:/g, "<")
      .replace(/<\/ss:/g, "</")
      .replace(/ ss:Type=/g, " Type=")
      .replace(/ ss:Name=/g, " Name=");
    const bets = parseBets(bare);
    expect(bets).toHaveLength(6);
    expect(bets[4].legs).toHaveLength(3);
  });

  it("handles leg rows shifted right by one (older export variant)", () => {
    const cell = (v: string) => `<Cell><Data Type="String">${v}</Data></Cell>`;
    const row = (vals: string[]) => `<Row>${vals.map(cell).join("")}</Row>`;
    const xml = `<?xml version="1.0"?><Workbook><Worksheet><Table>
      ${row(["Date Placed","Status","League","Match","Bet Type","Market","Price","Wager","Winnings","Payout","Potential Payout","Result","Bet Slip ID"])}
      ${row(["15 Feb 2026 @ 5:30pm","Lost","","2 Selections","MULTIPLE","MULTIPLE","4.00","10.00","0.00","0.00","40.00","Lose","B1"])}
      ${row(["","1 Feb 2026 @ 1:00pm","Win","NBA","Lakers vs Celtics","Moneyline","Lakers","2.00","null","null","null","null","Win",""])}
      ${row(["","2 Feb 2026 @ 1:00pm","Lose","NFL","Chiefs vs Broncos","Spread","Chiefs -7.5","2.00","null","null","null","null","Lose",""])}
    </Table></Worksheet></Workbook>`;
    const bets = parseBets(xml);
    expect(bets).toHaveLength(1);
    expect(bets[0].legs).toHaveLength(2);
    expect(bets[0].legs[0].status).toBe("Win");
    expect(bets[0].legs[0].match).toBe("Lakers vs Celtics");
    expect(bets[0].legs[1].market).toBe("Chiefs -7.5");
  });
});
