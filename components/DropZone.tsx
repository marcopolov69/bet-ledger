"use client";

import { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  error: string | null;
  busy: boolean;
}

export default function DropZone({ onFile, error, busy }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

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
        className={`slip cursor-pointer select-none px-6 pt-8 pb-0 transition-transform duration-200 outline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--amber)] ${
          dragging ? "scale-[1.02] rotate-[0.5deg]" : "hover:-rotate-[0.4deg]"
        }`}
        style={dragging ? { boxShadow: "0 0 0 3px var(--amber), 0 30px 60px -20px rgba(0,0,0,.65)" } : undefined}
      >
        <div className="flex items-baseline justify-between">
          <span className="label-paper">BurryApp · Official Slip</span>
          <span className="label-paper tnum">No. 000001</span>
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
