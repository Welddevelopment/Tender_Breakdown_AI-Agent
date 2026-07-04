import { normalize } from "@/lib/dedupe";

// The claim ↔ source text-matching engine, shared by every "verify this against the
// real document" view (PDF, and now DOCX/XLSX/CSV). Given a rendered document's plain
// text and a requirement's source_excerpt, finds where the excerpt actually sits and
// how confidently — never overclaiming a match. Originally lived in PdfSourceView;
// pulled out so the Office-format viewers can reuse the exact same honest semantics
// instead of inventing a second standard for "did this really match."

export type MatchKind = "exact" | "approximate" | "unlocated";

// A whitespace-flexible search: runs of whitespace in the excerpt match any
// whitespace in the haystack (line breaks become spaces), everything else is
// matched literally. Returns the [start, end) char range in `haystack`, or null.
export function findRange(haystack: string, phrase: string): [number, number] | null {
  const trimmed = phrase.trim();
  if (!trimmed) return null;
  const pattern = trimmed
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  const match = new RegExp(pattern, "i").exec(haystack);
  return match ? [match.index, match.index + match[0].length] : null;
}

// Locate the excerpt in the haystack text. An exact hit on the whole excerpt is the
// verified match; if only a leading run matches (wording drifted mid-sentence, or the
// extractor tidied punctuation), that is an honest "close match"; nothing at all is
// "couldn't pin the line".
export function locate(
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
