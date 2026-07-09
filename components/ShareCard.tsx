"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StatsSummary } from "@/lib/types";
import { renderShareCard } from "@/lib/share-card";

export default function ShareCard({ stats }: { stats: StatsSummary }) {
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setBusy(true);
    try {
      const blob = await renderShareCard(stats);
      blobRef.current = blob;
      setImgUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      const file = new File([blob], "betledger.png", { type: "image/png" });
      setCanNativeShare(
        typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] })
      );
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }, [stats]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const download = useCallback(() => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = "betledger.png";
    a.click();
  }, [imgUrl]);

  const createLink = useCallback(async () => {
    if (!linkName.trim() || linkBusy) return;
    setLinkBusy(true);
    setLinkError(false);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: linkName.trim(), stats }),
      });
      if (!res.ok) throw new Error("share failed");
      const { id } = await res.json();
      setLinkUrl(`${window.location.origin}/b/${id}`);
    } catch {
      setLinkError(true);
    } finally {
      setLinkBusy(false);
    }
  }, [linkName, linkBusy, stats]);

  const copyLink = useCallback(async () => {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [linkUrl]);

  const nativeShare = useCallback(async () => {
    if (!blobRef.current) return;
    const file = new File([blobRef.current], "betledger.png", {
      type: "image/png",
    });
    try {
      await navigator.share({ files: [file], title: "My BetLedger" });
    } catch {
      // user cancelled — nothing to do
    }
  }, []);

  return (
    <>
      <div className="text-center">
        <button
          onClick={generate}
          disabled={busy}
          className="display uppercase tracking-widest text-sm font-semibold cursor-pointer rounded-md border border-[var(--amber)] px-6 py-2.5 text-[var(--amber)] hover:bg-[var(--amber)] hover:text-[var(--bg)] transition-colors disabled:opacity-50"
        >
          {busy ? "Printing…" : "Share this ledger"}
        </button>
      </div>

      <div
        className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share your ledger"
          className={`absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center transition-transform duration-300 ease-out ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="slip !rounded-b-none sm:!rounded-b-md w-full sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto px-5 pt-5 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="label-paper">BetLedger · Souvenir Print</div>
              <button
                ref={closeRef}
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="h-9 w-9 -mr-2 rounded-full text-xl leading-none text-[var(--paper-dim)] hover:text-[var(--paper-ink)] hover:bg-[rgba(33,31,24,0.07)] cursor-pointer"
              >
                ×
              </button>
            </div>

            {imgUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt="Your BetLedger share card: net profit/loss with key stats"
                className="w-full rounded-md border border-[rgba(33,31,24,0.25)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]"
              />
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={download}
                className="display uppercase tracking-widest text-sm font-semibold cursor-pointer rounded-md border-2 border-[var(--paper-ink)] px-4 py-2.5 hover:bg-[var(--paper-ink)] hover:text-[var(--paper)] transition-colors"
              >
                Save image
              </button>
              {canNativeShare ? (
                <button
                  onClick={nativeShare}
                  className="display uppercase tracking-widest text-sm font-semibold cursor-pointer rounded-md bg-[var(--paper-ink)] text-[var(--paper)] px-4 py-2.5 hover:opacity-85 transition-opacity"
                >
                  Share
                </button>
              ) : (
                <div className="text-[11px] text-[var(--paper-dim)] self-center leading-snug">
                  Save it, then post it anywhere.
                </div>
              )}
            </div>

            <div className="perf mt-5" />
            <div className="pt-4">
              <div className="label-paper mb-2">Live link</div>
              {!linkUrl ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createLink()}
                    placeholder="Your name"
                    maxLength={24}
                    className="flex-1 min-w-0 rounded-md border-2 border-[rgba(33,31,24,0.3)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--paper-dim)] focus:outline-none focus:border-[var(--paper-ink)]"
                  />
                  <button
                    onClick={createLink}
                    disabled={!linkName.trim() || linkBusy}
                    className="display uppercase tracking-widest text-sm font-semibold cursor-pointer rounded-md border-2 border-[var(--paper-ink)] px-4 py-2 hover:bg-[var(--paper-ink)] hover:text-[var(--paper)] transition-colors disabled:opacity-40 disabled:cursor-default"
                  >
                    {linkBusy ? "Printing…" : "Create"}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={linkUrl}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 rounded-md border-2 border-[rgba(33,31,24,0.3)] bg-[rgba(33,31,24,0.05)] px-3 py-2 text-xs tnum"
                  />
                  <button
                    onClick={copyLink}
                    className="display uppercase tracking-widest text-sm font-semibold cursor-pointer rounded-md bg-[var(--paper-ink)] text-[var(--paper)] px-4 py-2 hover:opacity-85 transition-opacity"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
              <p className="mt-2 text-[11px] text-[var(--paper-dim)] leading-snug">
                {linkError
                  ? "Couldn't create the link — try again."
                  : "Anyone with the link sees a live view of this dashboard with your name on it."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
