import type { Requirement } from "@/types/requirement";
import { sourceDocUrl } from "@/lib/api";

export type SourceDocumentKind = "pdf" | "word" | "excel" | "csv" | "document";

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
