"use client";

import { useEffect, useState } from "react";
import type { MatchKind } from "@/lib/text-match";
import { locate } from "@/lib/text-match";

// The Office-format sibling of PdfSourceView, for XLSX/CSV: renders the REAL
// spreadsheet as a table (via exceljs for .xlsx — already a frontend dependency
// for the styled export — or a small CSV parser) and highlights the row the
// requirement actually came from. Unlike DOCX prose, ingest_office.py's row
// locator ("XLSX Pricing row 6 | A6:E6", "CSV row 2") gives an exact, deterministic
// row number, so the primary path highlights that row directly rather than
// searching for it; a text search over every row is still the fallback for honesty
// if the parsed row doesn't actually contain the excerpt (a stale locator, a
// reconciled/merged row, etc.), using the same engine PdfSourceView uses.

interface SheetSourceViewProps {
  docUrl: string;
  isCsv: boolean;
  sourceClause: string | null;
  excerpt: string;
  onMatch?: (kind: MatchKind) => void;
}

type LoadState = "loading" | "ready" | "error";

interface SheetData {
  sheetName: string | null;
  rows: string[][];
}

const sheetCache = new Map<string, Promise<SheetData>>();

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Extracts the sheet name from a locator like "XLSX Pricing row 6 | A6:E6", so the
// right sheet is shown (a workbook may have more than one).
function sheetNameFromClause(clause: string | null): string | null {
  if (!clause) return null;
  const m = /^XLSX\s+(.+?)\s+row\s+\d+/i.exec(clause);
  return m ? m[1] : null;
}

function getCachedSheet(url: string, isCsv: boolean, wantSheet: string | null): Promise<SheetData> {
  const key = `${url}::${wantSheet ?? ""}`;
  let entry = sheetCache.get(key);
  if (!entry) {
    entry = (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`could not fetch ${url}: ${res.status}`);
      if (isCsv) {
        const text = await res.text();
        return { sheetName: null, rows: parseCsv(text) };
      }
      const { Workbook } = await import("exceljs");
      const wb = new Workbook();
      await wb.xlsx.load(await res.arrayBuffer());
      const found = wantSheet ? wb.worksheets.find((w) => w.name === wantSheet) : undefined;
      const ws = found ?? wb.worksheets[0];
      const rows: string[][] = [];
      ws.eachRow((row) => {
        const values = (row.values as unknown[]).slice(1);
        rows.push(values.map((v) => (v == null ? "" : String(v))));
      });
      return { sheetName: ws.name, rows };
    })();
    entry.catch(() => sheetCache.delete(key));
    sheetCache.set(key, entry);
  }
  return entry;
}

// Which row (0-based) actually holds the excerpt, and how confidently. Tries the
// locator-given row first (fast path, genuinely exact since it's the row the
// excerpt was itself generated from); falls back to searching every row's joined
// text with the same engine PdfSourceView uses, so a stale or off-by-one locator
// never silently highlights the wrong line.
function findHighlightRow(
  data: SheetData | null,
  excerpt: string,
  targetRowNum: number | null
): { index: number; kind: MatchKind } | null {
  if (!data) return null;
  const rowText = (r: string[]) => r.join(" ").trim();

  if (targetRowNum && targetRowNum - 1 < data.rows.length) {
    const candidate = rowText(data.rows[targetRowNum - 1]);
    const { kind } = locate(candidate, excerpt);
    if (kind !== "unlocated") return { index: targetRowNum - 1, kind };
  }

  let offset = 0;
  const joined = data.rows.map((r) => rowText(r)).join("\n");
  const { range, kind } = locate(joined, excerpt);
  if (range) {
    for (let i = 0; i < data.rows.length; i++) {
      const len = rowText(data.rows[i]).length;
      if (range[0] >= offset && range[0] < offset + len + 1) {
        return { index: i, kind };
      }
      offset += len + 1;
    }
  }
  return null;
}

export function SheetSourceView({
  docUrl,
  isCsv,
  sourceClause,
  excerpt,
  onMatch,
}: SheetSourceViewProps) {
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<SheetData | null>(null);

  const wantSheet = sheetNameFromClause(sourceClause);
  const targetRow = /\brow\s+(\d+)/i.exec(sourceClause ?? "")?.[1];
  const targetRowNum = targetRow ? parseInt(targetRow, 10) : null;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState("loading");
      setData(null);
      try {
        const sheet = await getCachedSheet(docUrl, isCsv, wantSheet);
        if (cancelled) return;
        setData(sheet);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [docUrl, isCsv, wantSheet]);

  // Which row (0-based) actually holds the excerpt, and how confidently — a pure,
  // cheap derivation (a handful of table rows) recomputed each render rather than
  // memoized, so there's no manual-memoization bookkeeping for the React Compiler
  // to reconcile.
  const highlight = findHighlightRow(data, excerpt, targetRowNum);

  // Report the match up to the claim panel whenever the sheet/derived match changes
  // — a side effect on an external callback, not a self setState, so this is what
  // an effect is for.
  useEffect(() => {
    if (!data) return;
    onMatch?.(highlight ? highlight.kind : "unlocated");
  }, [data, highlight, onMatch]);

  return (
    <div className="h-full overflow-auto bg-paper-recessed shadow-[var(--depth-pressed)]">
      {state === "loading" && (
        <p className="p-6 font-mono text-xs text-ink-muted">Opening the document…</p>
      )}
      {state === "error" && (
        <p className="p-6 font-mono text-xs text-ink-muted">
          Couldn&rsquo;t render this {isCsv ? "CSV" : "Excel"} file here. The exact
          wording in the panel is what Bidframe read from it.
        </p>
      )}
      {state === "ready" && data && (
        <table className="w-full border-collapse font-mono text-xs">
          <tbody>
            {data.rows.map((row, i) => {
              const isHit = highlight?.index === i;
              const rowClass = isHit
                ? highlight!.kind === "exact"
                  ? "bg-forest/20 ring-1 ring-inset ring-forest/40"
                  : "bg-signal-amber/20 ring-1 ring-inset ring-signal-amber/50"
                : "";
              return (
                <tr key={i} className={rowClass} ref={isHit ? scrollIntoViewRef : undefined}>
                  {row.map((cell, j) => (
                    <td key={j} className="border border-ink/15 p-1.5 text-ink">
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// A tiny ref-callback that scrolls a highlighted row into view exactly once when
// it mounts, matching the "bring the match into view" behaviour of the other
// source views (PdfSourceView, DocxSourceView).
function scrollIntoViewRef(node: HTMLTableRowElement | null) {
  node?.scrollIntoView({ block: "center" });
}
