"use client";

import { useCallback, useEffect, useState } from "react";
import DropZone from "@/components/DropZone";
import HowToSheet from "@/components/HowToSheet";
import ShareCard from "@/components/ShareCard";
import HeroTicket from "@/components/HeroTicket";
import StatGrid from "@/components/StatGrid";
import CumulativeChart from "@/components/CumulativeChart";
import MonthlyChart from "@/components/MonthlyChart";
import OddsBands from "@/components/OddsBands";
import RecordSlips from "@/components/RecordSlips";
import LeagueTables from "@/components/LeagueTables";
import TheRead from "@/components/TheRead";
import { parseBets, ParseError } from "@/lib/parse";
import { computeStats } from "@/lib/stats";
import type { StatsSummary } from "@/lib/types";

const STORAGE_KEY = "burryapp:stats:v1";
const LEGACY_STORAGE_KEY = "betledger:stats:v1";
const DEVICE_KEY = "burryapp:device:v1";

/** Anonymous, random, per-browser id — groups repeat submissions without
 *  identifying anyone. Never derived from IP or fingerprinting. */
function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "no-device";
  }
}

export default function Home() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);

  // Returning visitors get their last graded dashboard back instantly.
  useEffect(() => {
    try {
      // one-time migration from the pre-rename key
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy && !localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, legacy);
      }
      if (legacy) localStorage.removeItem(LEGACY_STORAGE_KEY);

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setStats(JSON.parse(saved).stats as StatsSummary);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      const computed = computeStats(parseBets(text));
      setStats(computed);
      window.scrollTo({ top: 0 });
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ savedAt: Date.now(), stats: computed })
        );
      } catch {
        // storage full/blocked — dashboard still works
      }
      // Fire-and-forget: archive the submission server-side.
      fetch("/api/submissions", {
        method: "POST",
        body: text,
        headers: { "x-device-id": getDeviceId() },
      }).catch(() => {});
    } catch (e) {
      setStats(null);
      setError(
        e instanceof ParseError
          ? e.message
          : "Something went wrong reading that file. Try re-exporting it from the Hard Rock app."
      );
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="flex items-baseline justify-between mb-10 sm:mb-14">
        <h1 className="display font-extrabold text-2xl tracking-wide lowercase">
          burry<span className="text-[var(--accent)]">app</span>
        </h1>
        {stats ? (
          <button
            onClick={() => {
              setStats(null);
              setError(null);
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch {}
            }}
            className="label hover:text-[var(--ink)] transition-colors cursor-pointer underline underline-offset-4 decoration-[var(--line)]"
          >
            Grade another ticket
          </button>
        ) : (
          <span className="label hidden sm:inline">Outplay the house.</span>
        )}
      </header>

      {!stats ? (
        <div className="py-8 sm:py-16">
          <DropZone onFile={handleFile} error={error} busy={busy} />
          <div className="text-center mt-4">
            <button
              onClick={() => setHowToOpen(true)}
              className="label shimmer-link cursor-pointer underline underline-offset-4 decoration-[var(--green)]"
            >
              How to get your All Bets Export (45 seconds)
            </button>
          </div>
          <HowToSheet open={howToOpen} onClose={() => setHowToOpen(false)} />
        </div>
      ) : (
        <div className="space-y-10">
          <HeroTicket stats={stats} />
          <ShareCard stats={stats} />
          <StatGrid stats={stats} />
          <div className="grid lg:grid-cols-[3fr_2fr] gap-4">
            <CumulativeChart stats={stats} />
            <MonthlyChart stats={stats} />
          </div>
          <div className="grid lg:grid-cols-3 gap-4 items-start">
            <OddsBands stats={stats} />
            <LeagueTables stats={stats} />
          </div>
          <RecordSlips stats={stats} />
          <TheRead stats={stats} />
        </div>
      )}

      <footer className="mt-16 pt-6 border-t border-[var(--line)] text-[11px] text-[var(--ink-dim)] leading-relaxed">
        <p>BurryApp is not affiliated with Hard Rock Bet.</p>
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
