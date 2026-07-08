"use client";

import { useEffect, useRef, useState } from "react";
import { docRequestHeaders } from "@/lib/api";
import type { MatchKind } from "@/lib/text-match";
import { highlightExcerptInHtml } from "@/lib/dom-highlight";

// The Office-format sibling of PdfSourceView: renders the REAL .docx (not just its
// extracted excerpt) via mammoth (docx -> semantic HTML, dynamically imported so the
// library only loads when a Word source is actually opened), then highlights the
// paragraph the requirement text actually came from using the same whitespace-
// flexible search PdfSourceView already uses when a PDF has no stored highlight
// coordinate. There's no locator-driven exact position for prose paragraphs (unlike
// XLSX/CSV rows), so a real text search is the honest choice here, not an invented
// one. The highlight is baked into the HTML STRING before it's ever handed to React
// (see dom-highlight.ts) rather than applied to the live DOM afterward — mutating the
// rendered tree directly doesn't survive an unrelated re-render of an ancestor.

interface DocxSourceViewProps {
  docUrl: string;
  excerpt: string;
  onMatch?: (kind: MatchKind) => void;
}

type LoadState = "loading" | "ready" | "error";

// Session-cached like PdfSourceView's document cache: the same rendered HTML serves
// every requirement citing this file, so switching rows only re-highlights.
const htmlCache = new Map<string, Promise<string>>();

function getCachedHtml(url: string): Promise<string> {
  let entry = htmlCache.get(url);
  if (!entry) {
    entry = (async () => {
      const [mammoth, res] = await Promise.all([
        import("mammoth"),
        // Bearer header for live-backend files; static /demo copies need none.
        fetch(url, { headers: docRequestHeaders(url) }),
      ]);
      if (!res.ok) throw new Error(`could not fetch ${url}: ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return result.value;
    })();
    entry.catch(() => htmlCache.delete(url));
    htmlCache.set(url, entry);
  }
  return entry;
}

export function DocxSourceView({ docUrl, excerpt, onMatch }: DocxSourceViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rawHtml, setRawHtml] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState("loading");
      setRawHtml(null);
      try {
        const value = await getCachedHtml(docUrl);
        if (cancelled) return;
        setRawHtml(value);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [docUrl]);

  // Highlight is derived synchronously from rawHtml + excerpt (no state of its own):
  // the resulting string already contains the highlight class, so it can't be wiped
  // by a later re-render the way a post-render DOM mutation could be.
  const highlighted = rawHtml ? highlightExcerptInHtml(rawHtml, excerpt) : null;

  useEffect(() => {
    if (!highlighted) return;
    onMatch?.(highlighted.kind);
    scrollRef.current?.querySelector(".rounded-sm")?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighted?.html, highlighted?.kind]);

  return (
    <div className="h-full overflow-auto bg-paper-recessed shadow-[var(--depth-pressed)]">
      {state === "loading" && (
        <p className="p-6 font-mono text-xs text-ink-muted">Opening the document…</p>
      )}
      {state === "error" && (
        <p className="p-6 font-mono text-xs text-ink-muted">
          Couldn&rsquo;t render this Word document here. The exact wording in the
          panel is what Bidframe read from it.
        </p>
      )}
      {state === "ready" && highlighted && (
        <div
          ref={scrollRef}
          className="mx-auto max-w-[70ch] p-6 font-serif text-sm leading-relaxed text-ink [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_p]:mt-2 [&_table]:mt-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-ink/20 [&_td]:p-1.5 [&_th]:border [&_th]:border-ink/20 [&_th]:p-1.5"
          // mammoth's output is semantic HTML generated from the tenant's own
          // uploaded docx (headings/paragraphs/tables) — not user-supplied markup
          // at render time, and every deployment already trusts this file (it was
          // uploaded by the signed-in bidder to their own tender). The highlight
          // class is already baked into this string by highlightExcerptInHtml.
          dangerouslySetInnerHTML={{ __html: highlighted.html }}
        />
      )}
    </div>
  );
}
