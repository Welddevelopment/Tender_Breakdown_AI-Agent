"use client";

import { useEffect, useRef, useState } from "react";
import { normalize } from "@/lib/dedupe";

// The P2 verification engine (graph-and-verification-deep-plan.md Part B): render
// the real tender page with PDF.js and highlight the exact line a claim was lifted
// from, by searching the page's own text layer for the excerpt. No backend and no
// stored coordinates: the excerpt was extracted from this page, so it is almost
// always present verbatim, and we say so honestly when it is only a close match.
//
// Everything here is client-only — pdfjs is dynamically imported inside the effect
// so it never runs on the server, and the worker is served from /public.

// How well the excerpt matched the page text. Reported up so the claim side can
// carry the honest signal (forest = verified, amber = close, muted = not pinned).
export type MatchKind = "exact" | "approximate" | "unlocated";

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

// A whitespace-flexible search: runs of whitespace in the excerpt match any
// whitespace in the page text (PDF line breaks become spaces), everything else is
// matched literally. Returns the [start, end) char range in `haystack`, or null.
function findRange(haystack: string, phrase: string): [number, number] | null {
  const trimmed = phrase.trim();
  if (!trimmed) return null;
  const pattern = trimmed
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  const match = new RegExp(pattern, "i").exec(haystack);
  return match ? [match.index, match.index + match[0].length] : null;
}

// Locate the excerpt in the page text. An exact hit on the whole excerpt is the
// verified match; if only a leading run matches (wording drifted mid-sentence, or
// the extractor tidied punctuation), that is an honest "close match"; nothing at
// all is "couldn't pin the line".
function locate(
  haystack: string,
  excerpt: string
): { range: [number, number] | null; kind: MatchKind } {
  const full = findRange(haystack, excerpt);
  if (full) return { range: full, kind: "exact" };

  // Normalised containment still counts as exact — it only differs by punctuation
  // or spacing, which is not a wording change.
  if (normalize(excerpt) && normalize(haystack).includes(normalize(excerpt))) {
    const words = excerpt.trim().split(/\s+/);
    for (const n of [16, 12, 8, 5]) {
      if (words.length >= n) {
        const r = findRange(haystack, words.slice(0, n).join(" "));
        if (r) return { range: r, kind: "exact" };
      }
    }
    return { range: null, kind: "exact" };
  }

  // A leading run matches but the whole excerpt doesn't: close, not verbatim.
  const words = excerpt.trim().split(/\s+/);
  for (const n of [16, 12, 8, 5]) {
    if (words.length >= n) {
      const r = findRange(haystack, words.slice(0, n).join(" "));
      if (r) return { range: r, kind: "approximate" };
    }
  }
  return { range: null, kind: "unlocated" };
}

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
    // Keep a handle so we can tear the document down on unmount / re-run.
    let cleanup: (() => void) | undefined;

    async function render() {
      setState("loading");
      setHighlights([]);
      try {
        const pdfjs = await import("pdfjs-dist");
        // The worker is copied into /public at build time (matched version).
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const doc = await pdfjs.getDocument({ url: pdfUrl }).promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        cleanup = () => doc.destroy();

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
      cleanup?.();
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
