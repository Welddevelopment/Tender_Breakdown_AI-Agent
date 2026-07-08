"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { docRequestHeaders } from "@/lib/api";
import { locate, type MatchKind } from "@/lib/text-match";

// Loaded documents, cached for the session keyed by URL, so the persistent
// evidence pane doesn't refetch and reparse the whole tender PDF every time the
// selected requirement changes. Cached documents are deliberately never
// destroyed (a handful of tender packs fit comfortably in memory); a failed
// load evicts itself so a retry can succeed.
type PdfjsModule = typeof import("pdfjs-dist");
const documentCache = new Map<string, Promise<PDFDocumentProxy>>();

function getCachedDocument(
  pdfjs: PdfjsModule,
  url: string
): Promise<PDFDocumentProxy> {
  let entry = documentCache.get(url);
  if (!entry) {
    // Live-backend documents authenticate with the bearer header (the URL
    // carries no token any more); static /demo copies get no headers.
    entry = pdfjs.getDocument({
      url,
      httpHeaders: docRequestHeaders(url),
    }).promise;
    entry.catch(() => documentCache.delete(url));
    documentCache.set(url, entry);
  }
  return entry;
}

// The P2 verification engine (graph-and-verification-deep-plan.md Part B): render
// the real tender page with PDF.js and highlight the exact line a claim was lifted
// from, by searching the page's own text layer for the excerpt. No backend and no
// stored coordinates: the excerpt was extracted from this page, so it is almost
// always present verbatim, and we say so honestly when it is only a close match.
//
// Everything here is client-only — pdfjs is dynamically imported inside the effect
// so it never runs on the server, and the worker is served from /public.

// How well the excerpt matched the page text (from lib/text-match). Reported up so
// the claim side can carry the honest signal (forest = verified, amber = close,
// muted = not pinned). Re-exported so existing importers of this module keep working.
export type { MatchKind };

interface PdfSourceViewProps {
  // The source PDF: a live tender doc (…/tenders/{id}/pdf?doc=&token=) or a static
  // demo copy in /public. Null when no PDF is available (excerpt-only fallback).
  pdfUrl: string;
  page: number;
  excerpt: string;
  onMatch?: (kind: MatchKind) => void;
}

interface Highlight {
  left: number;
  top: number;
  width: number;
  height: number;
}

type LoadState = "loading" | "ready" | "error";

// pdfjs page items are TextItem | TextMarkedContent; only TextItem carries `str`
// and geometry. This is the shape we read (marked-content rows drop out at runtime
// on the `str` check).
type TextItemLike = {
  str: string;
  transform: number[];
  width: number;
  height: number;
};

// Flatten a page's text layer to one string plus a char→item index map, so a
// matched character range can be turned back into the items to highlight.
function readTextItems(items: TextItemLike[]): {
  concat: string;
  charItem: number[];
} {
  let concat = "";
  const charItem: number[] = [];
  items.forEach((it, i) => {
    for (let k = 0; k < it.str.length; k++) charItem.push(i);
    concat += it.str + " ";
    charItem.push(i);
  });
  return { concat, charItem };
}

export function PdfSourceView({
  pdfUrl,
  page,
  excerpt,
  onMatch,
}: PdfSourceViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [matchKind, setMatchKind] = useState<MatchKind>("unlocated");
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setState("loading");
      setHighlights([]);
      try {
        const pdfjs = await import("pdfjs-dist");
        // The worker is copied into /public at build time (matched version).
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        // Session-cached: the same document instance serves every requirement
        // that cites it, so switching rows only re-renders the page.
        const doc = await getCachedDocument(pdfjs, pdfUrl);
        if (cancelled) return;

        // The excerpt was extracted from the cited page, but the extractor's page
        // numbering can drift a page or two from the PDF's own paging. Search the
        // cited page first, then its nearest neighbours, and render whichever page
        // actually holds the line — honest about where it is, never a false hit.
        type PageProxy = Awaited<ReturnType<typeof doc.getPage>>;
        const cited = Math.min(Math.max(page, 1), doc.numPages);
        const candidates = Array.from(
          new Set([cited, cited + 1, cited - 1, cited + 2, cited - 2])
        ).filter((p) => p >= 1 && p <= doc.numPages);

        let best:
          | {
              pdfPage: PageProxy;
              items: TextItemLike[];
              charItem: number[];
              range: [number, number] | null;
              kind: MatchKind;
            }
          | null = null;
        for (const p of candidates) {
          const pg = await doc.getPage(p);
          if (cancelled) return;
          const text = await pg.getTextContent();
          const pageItems = (text.items as unknown as TextItemLike[]).filter(
            (it) => typeof it.str === "string"
          );
          const { concat, charItem } = readTextItems(pageItems);
          const located = locate(concat, excerpt);
          const hit = {
            pdfPage: pg,
            items: pageItems,
            charItem,
            range: located.range,
            kind: located.kind,
          };
          if (located.kind === "exact") {
            best = hit;
            break;
          }
          // Keep the cited page as the fallback; upgrade unlocated → approximate.
          if (!best || (located.kind === "approximate" && best.kind === "unlocated")) {
            best = hit;
          }
        }
        if (cancelled) return;
        if (!best) {
          setState("error");
          return;
        }

        const { pdfPage, items, charItem, range, kind } = best;
        setMatchKind(kind);
        onMatch?.(kind);

        // Fit the chosen page to the pane width (measured), within sane bounds, then
        // sharpen for the device pixel ratio without disturbing the CSS geometry.
        const containerWidth = scrollRef.current?.clientWidth ?? 640;
        const base = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(Math.max(containerWidth / base.width, 0.5), 3);
        const viewport = pdfPage.getViewport({ scale });
        const dpr =
          typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        await pdfPage.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;
        setDims({ width: viewport.width, height: viewport.height });

        const boxes: Highlight[] = [];
        if (range) {
          const covered = new Set(charItem.slice(range[0], range[1]));
          covered.forEach((i) => {
            const it = items[i];
            const tx = pdfjs.Util.transform(viewport.transform, it.transform);
            const fontHeight = Math.hypot(tx[1], tx[3]) || it.height * scale;
            const width = it.width * scale;
            boxes.push({
              left: tx[4],
              top: tx[5] - fontHeight,
              width,
              height: fontHeight,
            });
          });
        }
        if (cancelled) return;
        setHighlights(boxes);
        setState("ready");

        // Bring the first highlight into view within the scroller.
        if (boxes.length > 0 && scrollRef.current) {
          const top = Math.min(...boxes.map((b) => b.top));
          scrollRef.current.scrollTo({
            top: Math.max(top - 96, 0),
            behavior: "auto",
          });
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, page, excerpt, onMatch]);

  return (
    <div
      ref={scrollRef}
      className="relative h-full overflow-auto bg-paper-recessed shadow-[var(--depth-pressed)]"
    >
      {state === "loading" && (
        <p className="p-6 font-mono text-xs text-ink-muted">Opening the page…</p>
      )}
      {state === "error" && (
        <p className="p-6 font-mono text-xs text-ink-muted">
          Couldn&rsquo;t open the document here. Use &ldquo;Open the page&rdquo; to
          see it directly.
        </p>
      )}
      <div
        className="relative mx-auto"
        style={dims ? { width: dims.width, height: dims.height } : undefined}
      >
        <canvas ref={canvasRef} className="block" />
        {/* Highlight overlay, positioned in the same CSS pixels as the canvas.
            Forest where the excerpt matches the page verbatim, amber where it is
            only a close match, so the colour itself carries the honest signal. */}
        {highlights.map((h, i) => (
          <span
            key={i}
            aria-hidden
            className={`pointer-events-none absolute rounded-[1px] mix-blend-multiply ring-1 ${
              matchKind === "approximate"
                ? "bg-signal-amber/25 ring-signal-amber/50"
                : "bg-forest/25 ring-forest/40"
            }`}
            style={{
              left: h.left,
              top: h.top,
              width: h.width,
              height: h.height,
            }}
          />
        ))}
      </div>
    </div>
  );
}
