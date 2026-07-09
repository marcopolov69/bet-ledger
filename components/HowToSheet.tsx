"use client";

import { useEffect, useRef } from "react";

export default function HowToSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    // Restart the walkthrough from the top each time the sheet opens,
    // unless the user prefers reduced motion.
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        video.play().catch(() => {});
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      videoRef.current?.pause();
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="How to get your Hard Rock bet export"
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="slip !rounded-b-none max-h-[85vh] overflow-y-auto px-6 sm:px-8 pt-5 pb-8">
          {/* grab handle */}
          <div
            aria-hidden="true"
            className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[rgba(33,31,24,0.2)]"
          />

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="label-paper">BurryApp · Field Guide</div>
              <h2 className="display font-bold text-2xl sm:text-3xl uppercase tracking-tight mt-1">
                Get your export in ~1 minute
              </h2>
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 -mr-2 -mt-1 h-9 w-9 rounded-full text-xl leading-none text-[var(--paper-dim)] hover:text-[var(--paper-ink)] hover:bg-[rgba(33,31,24,0.07)] cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="mt-4 flex items-baseline gap-4">
            <span className="display font-bold text-2xl text-[var(--accent-ink)] tnum w-5 text-right shrink-0">
              1
            </span>
            <p className="text-sm leading-relaxed">
              Log into your Hard Rock account at{" "}
              <a
                href="https://www.hardrock.bet"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2 decoration-[var(--accent-ink)] hover:text-[#4a38c2]"
              >
                hardrock.bet ↗
              </a>
            </p>
          </div>

          <div className="mt-3 flex items-baseline gap-4">
            <span className="display font-bold text-2xl text-[var(--accent-ink)] tnum w-5 text-right shrink-0">
              2
            </span>
            <p className="text-sm leading-relaxed">
              Follow along — then drop the downloaded{" "}
              <span className="font-semibold">All_Bets_Export.xls</span> on the
              ticket:
            </p>
          </div>

          <div className="mt-3 rounded-md overflow-hidden border border-[rgba(33,31,24,0.25)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]">
            <video
              ref={videoRef}
              src="/how-to-export.mp4"
              autoPlay
              loop
              muted
              playsInline
              controls
              preload="metadata"
              onCanPlay={(e) => {
                if (
                  open &&
                  e.currentTarget.paused &&
                  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ) {
                  e.currentTarget.play().catch(() => {});
                }
              }}
              aria-label="Screen recording: opening the account panel, choosing History, Bet History, then Export"
              className="block w-full"
            />
          </div>

          <div className="mt-5 rounded border-2 border-dashed border-[rgba(33,31,24,0.3)] px-4 py-3 text-[12px] leading-relaxed text-[var(--paper-dim)]">
            <span className="font-bold text-[var(--paper-ink)] uppercase tracking-wide">
              Heads up:
            </span>{" "}
            if the site asks you to install the <b>GeoComply</b>{" "}plug-in,
            you can skip it. It&apos;s only required for placing bets from the
            web — exporting your history works fine without it.
          </div>
        </div>
      </div>
    </div>
  );
}
