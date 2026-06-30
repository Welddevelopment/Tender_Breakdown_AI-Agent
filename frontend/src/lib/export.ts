import type { Requirement, RequirementStatus } from "@/types/requirement";

// Client-side export helpers for the response pack and the matrix CSV. Pure
// functions plus one browser download, so the export is self-contained: no
// backend, the bid manager always walks away with an artifact (the end of the
// worklist the master plan describes).

// The decision-status lexicon (copywriting.md). Shared with the matrix.
const STATUS_WORD: Record<RequirementStatus, string> = {
  pending: "Needs your eye",
  accepted: "Approved by you",
  edited: "Edited by you",
  flagged: "Flagged",
};

export function statusWord(status: RequirementStatus): string {
  return STATUS_WORD[status];
}

// Confidence as a word, never a raw number (the project rule), mirroring the
// four-tier lexicon in ConfidenceIndicator: a gating item with no decision yet
// reads "Can't answer this", and needs_review never reads better than amber.
export function confidenceWord(req: Requirement): string {
  const unanswerable = req.is_gating && req.status === "pending";
  let tier: string;
  if (unanswerable || req.confidence < 0.4) tier = "Can't answer this";
  else if (req.confidence < 0.6) tier = "Low confidence";
  else if (req.confidence < 0.8) tier = "Fairly sure";
  else tier = "Confident";
  if (req.needs_review && (tier === "Fairly sure" || tier === "Confident")) {
    tier = "Low confidence";
  }
  return tier;
}

export function prettyCategory(category: string): string {
  const s = category.replace(/[_-]/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface ResponseSummary {
  total: number;
  approved: number;
  edited: number;
  flagged: number;
  pending: number;
  gating: number;
}

export function summarize(reqs: Requirement[]): ResponseSummary {
  return {
    total: reqs.length,
    approved: reqs.filter((r) => r.status === "accepted").length,
    edited: reqs.filter((r) => r.status === "edited").length,
    flagged: reqs.filter((r) => r.status === "flagged").length,
    pending: reqs.filter((r) => r.status === "pending").length,
    gating: reqs.filter((r) => r.is_gating).length,
  };
}

// A short, honest one-liner of where the review landed, e.g.
// "12 approved, 2 edited, 1 flagged, 1 still needs you."
export function summaryLine(s: ResponseSummary): string {
  const parts = [
    `${s.approved} approved`,
    `${s.edited} edited`,
    `${s.flagged} flagged`,
  ];
  if (s.pending > 0) parts.push(`${s.pending} still need you`);
  return `${parts.join(", ")}.`;
}

const CSV_HEADERS = [
  "Clause",
  "Page",
  "Requirement",
  "Mandatory",
  "Deal-breaker",
  "Category",
  "Confidence",
  "Status",
  "Decision note",
  "Drafted answer",
  "Evidence",
];

function esc(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function requirementsToCsv(reqs: Requirement[]): string {
  const rows = reqs.map((r) =>
    [
      r.source_clause ?? "",
      `p.${r.source_page}`,
      r.text,
      r.type === "mandatory" ? "Yes" : "No",
      r.is_gating ? "Yes" : "No",
      prettyCategory(r.category),
      confidenceWord(r),
      statusWord(r.status),
      r.decision?.note ?? "",
      r.answer?.text ?? r.draft_answer ?? "",
      (r.answer?.evidence_refs ?? [])
        .map((e) => `${e.doc_id} p.${e.page}`)
        .join("; "),
    ]
      .map((v) => esc(String(v ?? "")))
      .join(",")
  );
  return [CSV_HEADERS.map(esc).join(","), ...rows].join("\r\n");
}

// Trigger a client-side download. A UTF-8 BOM keeps Excel happy with accented
// text and the pound sign.
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// A filesystem-safe slug for the download name, e.g. "it-managed-services".
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "tender"
  );
}
