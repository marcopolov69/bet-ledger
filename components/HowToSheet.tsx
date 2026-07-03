"use client";

import { useEffect, useRef } from "react";

// Paste a Loom share link's embed URL here (https://www.loom.com/embed/<id>)
// and the video walkthrough appears at the top of the sheet automatically.
const LOOM_EMBED_URL: string | null = null;

const STEPS: { text: React.ReactNode; chip?: string }[] = [
  {
    text: (
      <>
        Open{" "}
        <a
          href="https://www.hardrock.bet"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2 decoration-[var(--amber)] hover:text-[#9c6b1c]"
        >
          hardrock.bet ↗
        </a>{" "}
        and sign in — phone or computer both work.
      </>
    ),
  },
  {
    text: <>Tap your profile in the top-right corner to open the account panel.</>,
    chip: "Account",
  },
  {
    text: <>In the panel, open your bet history.</>,
    chip: "Bet History",
  },
  {
    text: (
      <>
        Hit export — Hard Rock hands you a file called{" "}
        <span className="font-semibold">All_Bets_Export.xls</span>.
      </>
    ),
    chip: "Export",
  },
  {
    text: <>Come back here and drop that file on the ticket. That&apos;s it.</>,
  },
];

export default function HowToSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
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
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg transition-transform duration-300 ease-out ${
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
              <div className="label-paper">BetLedger · Field Guide</div>
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

          {LOOM_EMBED_URL && (
            <div className="mt-4 rounded-md overflow-hidden border border-[rgba(33,31,24,0.2)]">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={LOOM_EMBED_URL}
                  title="Video walkthrough: exporting your Hard Rock bet history"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          )}

          <ol className="mt-5 space-y-4">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-baseline gap-4">
                <span className="display font-bold text-2xl text-[var(--amber)] tnum w-5 text-right shrink-0">
                  {i + 1}
                </span>
                <div className="text-sm leading-relaxed">
                  {step.text}
                  {step.chip && (
                    <span className="ml-2 inline-block align-baseline rounded border border-[rgba(33,31,24,0.3)] bg-[rgba(33,31,24,0.05)] px-2 py-0.5 text-[11px] font-semibold tracking-wide">
                      {step.chip}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded border-2 border-dashed border-[rgba(33,31,24,0.3)] px-4 py-3 text-[12px] leading-relaxed text-[var(--paper-dim)]">
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
