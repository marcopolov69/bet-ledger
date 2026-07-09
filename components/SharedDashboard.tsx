"use client";

import Link from "next/link";
import type { StatsSummary } from "@/lib/types";
import HeroTicket from "@/components/HeroTicket";
import StatGrid from "@/components/StatGrid";
import CumulativeChart from "@/components/CumulativeChart";
import MonthlyChart from "@/components/MonthlyChart";
import OddsBands from "@/components/OddsBands";
import RecordSlips from "@/components/RecordSlips";
import LeagueTables from "@/components/LeagueTables";

export default function SharedDashboard({
  name,
  stats,
}: {
  name: string;
  stats: StatsSummary;
}) {
  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="flex items-baseline justify-between mb-8 sm:mb-10">
        <Link
          href="/"
          className="display font-extrabold text-2xl tracking-wide uppercase"
        >
          Bet<span className="text-[var(--amber)]">Ledger</span>
        </Link>
        <Link
          href="/"
          className="label hover:text-[var(--ink)] transition-colors underline underline-offset-4 decoration-[var(--line)]"
        >
          Grade your own ticket
        </Link>
      </header>

      <div className="text-center mb-8">
        <div className="label">Official Ledger of</div>
        <h1 className="display font-extrabold text-4xl sm:text-5xl uppercase tracking-wide mt-1">
          {name}
        </h1>
      </div>

      <div className="space-y-10">
        <HeroTicket stats={stats} />
        <StatGrid stats={stats} />
        <div className="grid lg:grid-cols-[3fr_2fr] gap-4">
          <CumulativeChart stats={stats} />
          <MonthlyChart stats={stats} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          <OddsBands stats={stats} />
          <LeagueTables stats={stats} />
        </div>
        <RecordSlips stats={stats} />
      </div>

      <footer className="mt-16 pt-6 border-t border-[var(--line)] text-[11px] text-[var(--ink-dim)] leading-relaxed">
        <p>BetLedger is not affiliated with Hard Rock Bet.</p>
        <p className="mt-1">
          Gambling problem? Call{" "}
          <a href="tel:1-800-522-4700" className="underline underline-offset-2">
            1-800-GAMBLER
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
