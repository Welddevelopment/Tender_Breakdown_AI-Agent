"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTenders, isApiEnabled, type TenderSummary } from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";

// Compact upload date for the strip ("10 Jul 2026") — absolute, since the strip
// is a standing "what am I looking at" caption, not a recency feed.
function formatUploaded(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// The "what am I looking at" strip (UI Stage 4, Workstream A): sits above the
// dropzone so a user landing on /upload never has to wonder whether the
// counts on screen belong to the sample seed, an old tender, or the one they
// just filed. One raised sheet, same stationery as the dropzone/tender rows
// below it — title, then a plain-language meta line, then a quiet way into
// the matrix. tenderId === null is the only signal the app has for "this is
// the mock/demo seed, not a real upload" (RequirementsContext), so that's
// what gates the SAMPLE tag — never inferred from title text or counts.
export function CurrentTenderStrip() {
  const { title, tenderId, requirements, sourceDocs, seeding } =
    useRequirements();
  // The library's GET /tenders carries the collaboration signals the loaded-tender
  // context doesn't (upload date, people with access). Cross-reference this
  // tender's own id rather than widening the tender-detail contract. Live tenders
  // only (the sample seed has no backend row).
  const [summary, setSummary] = useState<TenderSummary | null>(null);
  useEffect(() => {
    if (!tenderId || !isApiEnabled()) return;
    let alive = true;
    getTenders()
      .then((ts) => {
        if (alive) setSummary(ts.find((t) => t.tenderId === tenderId) ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tenderId]);
  // Ignore a summary left over from a previously-loaded tender until the fetch
  // for the current one resolves — so counts never belong to the wrong tender.
  const activeSummary = summary?.tenderId === tenderId ? summary : null;

  // Hold a calm shell while the lazy seed is still loading, and stay silent
  // if there is nothing to report yet — this strip only ever describes a
  // tender that has actually loaded.
  if (seeding || requirements.length === 0) return null;

  const dealBreakerCount = requirements.filter((r) => r.is_gating).length;
  const isSample = tenderId === null;
  const uploaded = activeSummary?.uploadedAt
    ? formatUploaded(activeSummary.uploadedAt)
    : null;
  const memberCount = activeSummary?.memberCount;

  return (
    <div className="surface-grain mb-6 rounded-2xl border border-hairline bg-paper-raised px-5 py-4 shadow-[var(--depth-sheet)]">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
              Current tender
            </span>
            {isSample && (
              <span className="rounded border border-hairline px-1 py-px font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted/70">
                Sample data
              </span>
            )}
          </div>
          <h2 className="mt-1 truncate font-serif text-lg font-semibold leading-snug text-ink">
            {title}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-muted">
            <span>
              {sourceDocs.length} source document
              {sourceDocs.length === 1 ? "" : "s"}
            </span>
            <span>
              {requirements.length} requirement
              {requirements.length === 1 ? "" : "s"}
            </span>
            {dealBreakerCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-signal-oxblood">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-signal-oxblood"
                />
                {dealBreakerCount} deal-breaker{dealBreakerCount === 1 ? "" : "s"}
              </span>
            )}
            {memberCount !== undefined && memberCount > 1 && (
              <span>
                {memberCount} {memberCount === 1 ? "person" : "people"}
              </span>
            )}
            {uploaded && <span>uploaded {uploaded}</span>}
          </p>
        </div>
        <Link
          href="/review"
          className="shrink-0 font-mono text-xs text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:text-forest-hover"
        >
          Review →
        </Link>
      </div>
    </div>
  );
}
