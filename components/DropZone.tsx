"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  error: string | null;
  busy: boolean;
}

export default function DropZone({ onFile, error, busy }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [ticketNo, setTicketNo] = useState<number | null>(null);
  const [displayNo, setDisplayNo] = useState(0);

  // Live ticket number: total submissions + 1, counting up on arrival.
  useEffect(() => {
    let raf = 0;
    fetch("/api/submissions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ count }: { count: number }) => {
        const target = count + 1;
        setTicketNo(target);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setDisplayNo(target);
          return;
        }
        const start = performance.now();
        const dur = 900;
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          setDisplayNo(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch(() => {});
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) onFile(files[0]);
    },
    [onFile]
  );

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload your Hard Rock bet export file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`slip cursor-pointer select-none px-6 pt-8 pb-0 transition-transform duration-200 outline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
          dragging ? "scale-[1.02] rotate-[0.5deg]" : "hover:-rotate-[0.4deg]"
        }`}
        style={dragging ? { boxShadow: "0 0 0 3px var(--accent), 0 30px 60px -20px rgba(0,0,0,.65)" } : undefined}
      >
        <div className="flex items-baseline justify-end">
          <span className="label-paper tnum">
            Ticket Submission No.{" "}
            {ticketNo === null ? "····" : String(displayNo).padStart(4, "0")}
          </span>
        </div>

        <div className="text-center py-10">
          <div className="display font-bold text-5xl sm:text-6xl tracking-tight leading-none uppercase">
            {busy ? "Grading…" : dragging ? "Release to grade" : "Drop your ticket"}
          </div>
          <p className="mt-4 text-sm text-[var(--paper-dim)]">
            Drag in your Hard Rock{" "}
            <span className="font-semibold text-[var(--paper-ink)]">
              All_Bets_Export.xls
            </span>{" "}
            — or click to browse.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 border-2 border-[var(--red)] rounded px-4 py-3 text-sm font-medium text-[#a02c18] bg-[rgba(226,84,62,0.08)]"
          >
            {error}
          </div>
        )}

        <div className="perf" />
        <div className="flex items-center justify-between gap-4 px-1 py-4">
          <p className="text-[11px] leading-snug text-[var(--paper-dim)]">
            Graded instantly in your browser.
            <br />
            <span className="font-semibold">
              Stored anonymously — no account, no names.
            </span>
          </p>
          <div className="barcode w-28 shrink-0" aria-hidden="true" />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xml,.txt"
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

    </div>
  );
}
