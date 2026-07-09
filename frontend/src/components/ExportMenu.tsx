"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CapabilityDoc, Requirement } from "@/types/requirement";
import {
  buildDocx,
  buildMarkdown,
  buildText,
  slugifyTitle,
  triggerDownload,
  type ExportInput,
} from "@/lib/export-response";
import { deriveExportReadiness } from "@/lib/export-readiness";
import { ExportReadinessSummary } from "./ExportReadinessSummary";

// "Export response pack" — a forest button that opens a small dropdown of four
// formats, each with an icon. PDF prints via the browser (the print stylesheet
// strips the app chrome); DOCX/MD/TXT build client-side and download. Escape and
// click-outside close it; open/close is instant (reduced-motion safe).

type Format = "pdf" | "docx" | "md" | "txt";

const ITEMS: { format: Format; label: string; hint: string }[] = [
  { format: "pdf", label: "PDF", hint: "Print / save as PDF" },
  { format: "docx", label: "Word", hint: ".docx" },
  { format: "md", label: "Markdown", hint: ".md" },
  { format: "txt", label: "Plain text", hint: ".txt" },
];

export function ExportMenu({
  requirements,
  capabilityDocs,
  tenderTitle,
}: {
  requirements: Requirement[];
  capabilityDocs: CapabilityDoc[];
  tenderTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const readiness = useMemo(
    () => deriveExportReadiness(requirements),
    [requirements]
  );

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  async function run(format: Format) {
    const input: ExportInput = {
      title: tenderTitle,
      requirements,
      capabilityDocs,
    };
    const base = slugifyTitle(tenderTitle);
    setOpen(false);

    if (format === "pdf") {
      // Defer so the menu is closed (and unmounted from print) before printing.
      setTimeout(() => window.print(), 0);
      return;
    }
    if (format === "md") {
      triggerDownload(
        new Blob([buildMarkdown(input)], { type: "text/markdown;charset=utf-8" }),
        `${base}.md`
      );
      return;
    }
    if (format === "txt") {
      triggerDownload(
        new Blob([buildText(input)], { type: "text/plain;charset=utf-8" }),
        `${base}.txt`
      );
      return;
    }
    // docx — dynamically imported inside buildDocx.
    try {
      setBusy(true);
      const blob = await buildDocx(input);
      triggerDownload(blob, `${base}.docx`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Preparing…" : "Export response pack"}
        <ChevronIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-72 overflow-hidden rounded-md border border-hairline bg-paper-raised py-1 shadow-[var(--depth-sheet)]"
        >
          {/* Blockers first, before any format is picked. */}
          <ExportReadinessSummary readiness={readiness} />
          {ITEMS.map((item) => (
            <button
              key={item.format}
              type="button"
              role="menuitem"
              onClick={() => run(item.format)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-paper-recessed"
            >
              <FormatIcon format={item.format} />
              <span className="flex-1">{item.label}</span>
              <span className="font-mono text-xs text-ink-muted">
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M3 4.5 6 7.5 9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A quiet document glyph per format. The page + corner fold is shared; the mark
// inside distinguishes the format, tinted ink-muted so it reads as furniture.
function FormatIcon({ format }: { format: Format }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0 text-ink-muted"
    >
      <path
        d="M4 1.5h5L12.5 5v9.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M9 1.5V5h3.5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      {format === "pdf" && (
        <path d="M5.5 12.5h5M5.5 10h5M5.5 7.5h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      )}
      {format === "docx" && (
        <path d="M5.5 8.5 6.5 12l1-2.5 1 2.5 1-3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {format === "md" && (
        <path d="M5 12V8.5l1.5 1.5L8 8.5V12M10 8.5V12m0 0-1-1m1 1 1-1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {format === "txt" && (
        <path d="M5.5 8.5h5M5.5 10.5h5M5.5 12.5h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      )}
    </svg>
  );
}
