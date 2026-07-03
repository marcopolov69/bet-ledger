// Display formatting helpers (client-side only concerns live here,
// keeping parse.ts / stats.ts pure).

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function money(n: number): string {
  return usd.format(n);
}

/** Signed money: +$120.00 / −$45.50 */
export function signedMoney(n: number): string {
  const abs = usd.format(Math.abs(n));
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

export function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/** Decimal odds → American odds string (26.00 → +2500). */
export function americanOdds(decimal: number): string {
  if (decimal <= 1) return "—";
  if (decimal >= 2) return `+${Math.round((decimal - 1) * 100)}`;
  return `−${Math.round(100 / (decimal - 1))}`;
}

export function shortDate(t: number): string {
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}
