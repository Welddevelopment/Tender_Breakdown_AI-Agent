import { locate, type MatchKind } from "@/lib/text-match";

// Same honest match colours as PdfSourceView's highlight boxes: forest = verbatim,
// amber = close but not exact. Shared here so every "verify against the real
// document" view (PDF canvas overlay, DOCX/XLSX/CSV rendered-text highlight) reads
// as one visual language, not a per-format reinvention.
const MATCH_CLASSNAMES: Record<"exact" | "approximate", string> = {
  exact: "bg-forest/25 ring-1 ring-forest/40",
  approximate: "bg-signal-amber/25 ring-1 ring-signal-amber/50",
};

// Finds which rendered block (paragraph, list item, table cell, heading) holds the
// excerpt, and how confidently, then adds a highlight class to that WHOLE block —
// coarser than a precise substring, but robust: it never splits or reparents a text
// node. Uses the same whitespace-flexible search PdfSourceView uses on a PDF's text
// layer. Operates on a detached container (see highlightExcerptInHtml) — mutating a
// LIVE React-rendered dangerouslySetInnerHTML subtree doesn't stick, because any
// unrelated re-render of an ancestor makes React re-set innerHTML from its own
// remembered string, wiping out any DOM mutation made outside its knowledge.
function highlightBlock(container: HTMLElement, excerpt: string): MatchKind {
  const blocks = Array.from(
    container.querySelectorAll<HTMLElement>("p, li, td, th, h1, h2, h3, h4")
  );
  if (blocks.length === 0) return "unlocated";

  const texts = blocks.map((b) => (b.textContent ?? "").trim());
  const joined = texts.join("\n");
  const { range, kind } = locate(joined, excerpt);
  if (!range || kind === "unlocated") return kind;

  let offset = 0;
  for (let i = 0; i < texts.length; i++) {
    const len = texts[i].length;
    if (range[0] >= offset && range[0] < offset + len) {
      blocks[i].classList.add(
        ...`rounded-sm px-1 -mx-1 ${MATCH_CLASSNAMES[kind as "exact" | "approximate"]}`.split(" ")
      );
      break;
    }
    offset += len + 1; // +1 for the "\n" the blocks were joined with
  }
  return kind;
}

// Bakes the highlight into the HTML STRING itself — parses `html` into a detached
// (never-inserted) element, marks the matching block there, then serialises back to
// a string. React only ever sees the ALREADY-highlighted string as the value to
// render, so the mark survives any later re-render/remount instead of being erased
// by one, unlike a post-render DOM mutation on the live tree.
export function highlightExcerptInHtml(
  html: string,
  excerpt: string
): { html: string; kind: MatchKind } {
  const container = document.createElement("div");
  container.innerHTML = html;
  const kind = highlightBlock(container, excerpt);
  return { html: container.innerHTML, kind };
}
