"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CapabilityDoc, Requirement } from "@/types/requirement";
import { useRequirements } from "@/context/RequirementsContext";
import {
  buildDocx,
  buildEvidencePackDocx,
  buildEvidencePackMarkdown,
  buildMarkdown,
  buildText,
  slugifyTitle,
  triggerDownload,
  type ExportAudience,
  type ExportInput,
} from "@/lib/export-response";
import { exportMatrixCsv, exportMatrixXlsx } from "@/lib/export-matrix-xlsx";
import { deriveExportReadiness } from "@/lib/export-readiness";
import { ExportReadinessSummary } from "./ExportReadinessSummary";
import styles from "./ExportMenu.module.css";

// The one export surface (delete.md: one obvious "ready to export" area). It is
// artifact-first — pick what you need (the bid response, the compliance matrix,
// or the audit/evidence pack), then its format — with the honest readiness read
// shown first, before any format is chosen. Record-led: the forest lives on the
// export moment (the button), never sprayed across the emitted files.

type Artifact = "response" | "matrix" | "evidence";
type Format = "pdf" | "docx" | "md" | "txt" | "xlsx" | "csv";

interface FormatItem {
  format: Format;
  label: string;
  hint: string;
}
interface ArtifactGroup {
  key: Artifact;
  title: string;
  blurb: string;
  formats: FormatItem[];
}

// Three artifact types, each with its job (UX-OVERHAUL-BRIEF): the response draft
// to hand over, the matrix for internal tracking, the audit pack for proof.
const GROUPS: ArtifactGroup[] = [
  {
    key: "response",
    title: "Bid response draft",
    blurb: "The drafted answers, with their evidence.",
    formats: [
      { format: "pdf", label: "PDF", hint: "print / save as PDF" },
      { format: "docx", label: "Word", hint: ".docx" },
      { format: "md", label: "Markdown", hint: ".md" },
      { format: "txt", label: "Plain text", hint: ".txt" },
    ],
  },
  {
    key: "matrix",
    title: "Compliance matrix",
    blurb: "Every requirement, for internal tracking.",
    formats: [
      { format: "xlsx", label: "Excel", hint: ".xlsx" },
      { format: "csv", label: "CSV", hint: ".csv" },
    ],
  },
  {
    key: "evidence",
    title: "Audit and evidence pack",
    blurb: "The decision trail and the evidence behind each answer.",
    formats: [
      { format: "docx", label: "Word", hint: ".docx" },
      { format: "md", label: "Markdown", hint: ".md" },
    ],
  },
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
  const { awardCriteria } = useRequirements();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [audience, setAudience] = useState<ExportAudience>("internal");
  const rootRef = useRef<HTMLDivElement>(null);
  const readiness = useMemo(
    () => deriveExportReadiness(requirements),
    [requirements]
  );

  // The export-start "gather" beat: a one-shot settle on the trigger button,
  // fired only on the idle -> busy transition (never on the busy -> idle
  // return, and never again while busy stays true).
  const wasBusy = useRef(busy);
  const [gathering, setGathering] = useState(false);
  useEffect(() => {
    if (busy && !wasBusy.current) {
      setGathering(true);
    }
    wasBusy.current = busy;
  }, [busy]);
  // Client-ready is only offered when nothing blocks it; otherwise the response
  // draft falls back to internal, so a blocked tender can never emit a
  // client-ready pack (QA.md: export never implies readiness while blockers remain).
  const effectiveAudience: ExportAudience =
    readiness.clientReadyBlocked ? "internal" : audience;

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

  async function run(artifact: Artifact, format: Format) {
    const input: ExportInput = {
      title: tenderTitle,
      requirements,
      capabilityDocs,
      audience: effectiveAudience,
    };
    const base = slugifyTitle(tenderTitle);
    const suffix = effectiveAudience === "client" ? "-client" : "";
    setOpen(false);

    // Response draft.
    if (artifact === "response") {
      if (format === "pdf") {
        // Defer so the menu is closed (unmounted from print) before printing.
        setTimeout(() => window.print(), 0);
        return;
      }
      if (format === "md") {
        triggerDownload(
          new Blob([buildMarkdown(input)], { type: "text/markdown;charset=utf-8" }),
          `${base}${suffix}.md`
        );
        return;
      }
      if (format === "txt") {
        triggerDownload(
          new Blob([buildText(input)], { type: "text/plain;charset=utf-8" }),
          `${base}${suffix}.txt`
        );
        return;
      }
      await withBusy(async () =>
        triggerDownload(await buildDocx(input), `${base}${suffix}.docx`)
      );
      return;
    }

    // Compliance matrix (its builders set their own filenames).
    if (artifact === "matrix") {
      const matrixInput = { title: tenderTitle, requirements, awardCriteria };
      if (format === "csv") {
        exportMatrixCsv(matrixInput);
        return;
      }
      await withBusy(async () => exportMatrixXlsx(matrixInput));
      return;
    }

    // Audit / evidence pack.
    if (format === "md") {
      triggerDownload(
        new Blob([buildEvidencePackMarkdown(input)], {
          type: "text/markdown;charset=utf-8",
        }),
        `${base}-audit-pack.md`
      );
      return;
    }
    await withBusy(async () =>
      triggerDownload(await buildEvidencePackDocx(input), `${base}-audit-pack.docx`)
    );
  }

  async function withBusy(fn: () => Promise<void>) {
    try {
      setBusy(true);
      await fn();
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
        aria-busy={busy}
        onClick={() => setOpen((prev) => !prev)}
        onAnimationEnd={() => setGathering(false)}
        className={`ui-btn inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-60 ${
          gathering ? styles.gather : ""
        }`}
      >
        {busy ? "Preparing…" : "Export"}
        <ChevronIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 max-h-[min(70vh,32rem)] w-80 overflow-y-auto rounded-md border border-hairline bg-paper-raised py-1 shadow-[var(--depth-sheet)]"
        >
          {/* Blockers first, before any artifact or format is picked. */}
          <ExportReadinessSummary readiness={readiness} />

          {GROUPS.map((group) => (
            <div
              key={group.key}
              className="px-1 py-1.5 [&:not(:last-child)]:[border-bottom:var(--rule-hair)]"
            >
              <div className="px-2 pb-1">
                <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink">
                  {group.title}
                </p>
                <p className="text-xs leading-snug text-ink-muted">
                  {group.blurb}
                </p>
              </div>

              {/* The response draft alone carries the client-ready / internal
                  choice: client-ready is approved answers only, clean; internal
                  keeps the full detail. Client-ready is withheld while blocked. */}
              {group.key === "response" && (
                <div className="px-2 pb-2 pt-0.5">
                  <div className="inline-flex overflow-hidden rounded-md border border-hairline">
                    <button
                      type="button"
                      aria-pressed={effectiveAudience === "internal"}
                      onClick={() => setAudience("internal")}
                      className={`px-2.5 py-1 text-xs transition-colors ${
                        effectiveAudience === "internal"
                          ? "bg-forest text-paper"
                          : "bg-paper text-ink-muted hover:text-ink"
                      }`}
                    >
                      Internal
                    </button>
                    <button
                      type="button"
                      aria-pressed={effectiveAudience === "client"}
                      disabled={readiness.clientReadyBlocked}
                      onClick={() => setAudience("client")}
                      className={`px-2.5 py-1 text-xs transition-colors [border-left:var(--rule-hair)] ${
                        effectiveAudience === "client"
                          ? "bg-forest text-paper"
                          : "bg-paper text-ink-muted hover:text-ink"
                      } disabled:cursor-not-allowed disabled:text-ink-muted/50 disabled:hover:text-ink-muted/50`}
                    >
                      Client-ready
                    </button>
                  </div>
                  <p className="mt-1 text-xs leading-snug text-ink-muted">
                    {readiness.clientReadyBlocked
                      ? `Client-ready is held: ${readiness.clientReadyReason}`
                      : effectiveAudience === "client"
                        ? "Approved answers only, as clean prose."
                        : "Full detail: source, verdict, evidence, and any gap."}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-1 px-1">
                {group.formats.map((item) => (
                  <button
                    key={`${group.key}-${item.format}`}
                    type="button"
                    role="menuitem"
                    onClick={() => run(group.key, item.format)}
                    title={item.hint}
                    className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-paper px-2.5 py-1.5 text-sm text-ink shadow-[var(--depth-control)] transition-colors hover:border-forest hover:text-forest"
                  >
                    <FormatIcon format={item.format} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
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
      {(format === "xlsx" || format === "csv") && (
        <path d="M5 8h6M5 10.5h6M5 13h6M8 8v5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
