import type { Requirement } from "@/types/requirement";
import { sourceDocUrl, sourceDocRawFileUrl } from "@/lib/api";

export type SourceDocumentKind =
  | "pdf"
  | "word"
  | "excel"
  | "csv"
  | "zip"
  | "document";

function sourceExtension(filename: string | null | undefined): string | null {
  if (!filename) return null;
  const dot = filename.toLowerCase().lastIndexOf(".");
  return dot === -1 ? null : filename.toLowerCase().slice(dot);
}

function isPdfFilename(filename: string | null | undefined): boolean {
  const ext = sourceExtension(filename);
  return ext === null || ext === ".pdf";
}

export function sourceDocumentKindFromFilename(
  filename: string | null | undefined
): SourceDocumentKind {
  const ext = sourceExtension(filename);
  if (!ext) return "pdf";
  if (ext === ".pdf") return "pdf";
  if (ext === ".docx") return "word";
  if (ext === ".xlsx") return "excel";
  if (ext === ".csv") return "csv";
  if (ext === ".zip") return "zip";
  return "document";
}

export function sourceDocumentKind(req: Requirement): SourceDocumentKind {
  return sourceDocumentKindFromFilename(req.source_filename);
}

export function sourceKindName(kind: SourceDocumentKind): string {
  switch (kind) {
    case "pdf":
      return "PDF";
    case "word":
      return "Word";
    case "excel":
      return "Excel";
    case "csv":
      return "CSV";
    case "zip":
      return "ZIP";
    case "document":
      return "Document";
  }
}

export function sourceKindShortLabel(kind: SourceDocumentKind): string {
  switch (kind) {
    case "pdf":
      return "PDF";
    case "word":
      return "DOC";
    case "excel":
      return "XLS";
    case "csv":
      return "CSV";
    case "zip":
      return "ZIP";
    case "document":
      return "DOC";
  }
}

export function sourceKindLabel(req: Requirement): string {
  return sourceKindName(sourceDocumentKind(req));
}

export function hasPdfSource(req: Requirement): boolean {
  return sourceDocumentKind(req) === "pdf";
}

// Where a requirement's source PDF lives, shared by every surface that shows the
// document (the panel's verify overlay and the persistent evidence pane). One
// derivation so the two can never disagree: a live tender streams from the
// backend, the demo falls back to a static /public copy, and the plain mock has
// none (null — callers show the excerpt or a placeholder instead).

export function requirementPdfUrl(
  tenderId: string | null,
  req: Requirement
): string | null {
  if (!hasPdfSource(req)) return null;
  return sourceDocPdfUrl({
    tenderId,
    docId: req.source_doc_id ?? null,
    filename: req.source_filename ?? null,
  });
}

export function sourceDocPdfUrl(opts: {
  tenderId: string | null;
  docId?: string | null;
  filename?: string | null;
}): string | null {
  if (!isPdfFilename(opts.filename)) return null;
  return sourceDocUrl(opts);
}

// The quiet mono reference for a requirement's source location. PDF sources keep
// page wording; Word/Excel/CSV sources use the backend's locator string without
// pretending there is a PDF page to open.
export function sourceRefLabel(req: Requirement): string {
  const kind = sourceKindLabel(req);
  if (hasPdfSource(req)) {
    return req.source_clause
      ? `${kind} p.${req.source_page} · ${req.source_clause}`
      : `${kind} p.${req.source_page}`;
  }
  if (req.source_clause) return `${kind} · ${req.source_clause}`;
  return req.source_filename ? `${kind} · ${req.source_filename}` : kind;
}

export function sourceLocatorLabel(req: Requirement): string {
  if (hasPdfSource(req)) {
    return req.source_clause
      ? `p.${req.source_page}, ${req.source_clause}`
      : `p.${req.source_page}`;
  }
  return req.source_clause ?? sourceKindLabel(req);
}

// Static copies of the mixed-pack demo's Word/Excel/CSV fixtures, shipped in
// /public so the offline /pack + /showcase surfaces can render + highlight the
// REAL document with no backend and no key — the same reasoning as DEMO_PDFS
// above. Keyed by the source_filename carried on each requirement.
const DEMO_OFFICE_FILES: Record<string, string> = {
  "sample-return-forms.docx": "/demo/mixed-pack/sample-return-forms.docx",
  "sample-pricing-schedule.xlsx": "/demo/mixed-pack/sample-pricing-schedule.xlsx",
  "sample-compliance.csv": "/demo/mixed-pack/sample-compliance.csv",
};

// The source DOCX/XLSX/CSV URL for the claim/source verification view — the Office
// sibling of sourceDocPdfUrl. A live tender streams the real file from the backend
// (owner-scoped, token as a query param, via the generic /source endpoint); the
// mock/demo build falls back to a static public copy for a known demo fixture.
// Null when this requirement isn't Office-sourced or no copy is available.
export function sourceDocRawUrl(
  tenderId: string | null,
  req: Requirement
): string | null {
  if (sourceDocumentKind(req) === "pdf") return null;
  const live = sourceDocRawFileUrl({ tenderId, docId: req.source_doc_id });
  if (live) return live;
  return req.source_filename ? DEMO_OFFICE_FILES[req.source_filename] ?? null : null;
}

// Parse the row-oriented locator backend/app/ingest_office.py bakes into
// source_clause for XLSX/CSV rows ("XLSX Pricing row 6 | A6:E6", "CSV row 2") into
// a 1-based row number the sheet viewer can highlight directly. Null when the
// clause doesn't carry one (e.g. it was left as a heuristic-extractor clause).
export function parseSheetRowLocator(sourceClause: string | null | undefined): number | null {
  if (!sourceClause) return null;
  const m = /\brow\s+(\d+)/i.exec(sourceClause);
  return m ? parseInt(m[1], 10) : null;
}
