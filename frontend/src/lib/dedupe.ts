import type { Requirement } from "@/types/requirement";

// Display-level dedupe (view layer only). The recall-first extractor is tuned to
// miss nothing, so it emits the SAME underlying requirement several times, worded
// slightly differently or filed under a different category label (e.g. the SPSO
// 06/11/2013 submission deadline shows up as several rows). That is correct for
// recall, but it makes the matrix and the deal-breaker hero read as if there are
// far more distinct obligations than there really are.
//
// This helper collapses those near-duplicates for DISPLAY ONLY. It is pure, has
// no React, mutates nothing, and discards nothing: every folded member stays
// reachable on its group, and each group carries an `alsoCitedOn` annotation
// listing the other pages the same requirement was cited on. It never touches the
// engine's conservative reconcile — this is cosmetic and fully reversible.
//
// Conservative by construction. It mirrors the engine's rule ("never merge two
// DIFFERENT requirements") with a two-tier signal:
//
//   Tier A — exact:  identical normalized text (same is_gating). Two requirements
//            whose text is identical after normalization are provably the same
//            requirement; a differing category label there is extraction noise,
//            not a real distinction, so category is NOT required to match here.
//   Tier B — fuzzy:  NON-GATING rows only. token-Jaccard >= JACCARD_THRESHOLD AND
//            same category. Gating (deal-breaker) rows are NEVER folded on a fuzzy
//            signal — a differently-worded disqualifier could be genuinely distinct,
//            so gating collapses via Tier A (exact text) only. The category guard
//            keeps a fuzzy match from folding two genuinely different obligations.
//
// Anything that fails both tiers stays its own row. When in doubt, it splits —
// it will never hide a distinct obligation behind another.

// Two requirements whose text shares at least this fraction of tokens (Jaccard)
// are treated as the same underlying requirement — but only when is_gating and
// category also match (Tier B). Deliberately high so only close paraphrases fold.
export const JACCARD_THRESHOLD = 0.8;

// Metadata derived at collapse time for the chosen representative of a group.
// Nothing here is persisted onto the Requirement — it is render-time only.
export interface DedupeMeta {
  // The other pages this same requirement was cited on (the representative's own
  // page excluded), de-duplicated and sorted. Empty when the group is a single row.
  alsoCitedOn: number[];
  // Every requirement folded into this representative, in source order, including
  // the representative itself. Nothing is discarded — these stay reachable.
  members: Requirement[];
}

export interface CollapsedResult {
  // One representative per unique requirement, preserving first-seen source order.
  representatives: Requirement[];
  // Keyed by representative id → its folded members + `also cited on` pages.
  meta: Map<string, DedupeMeta>;
}

// Lowercase, strip punctuation/smart-quotes, collapse whitespace. Used both for
// exact-equality (Tier A) and as the token source for Jaccard (Tier B), so
// "Arrive no later than 12.00 noon 06/11/2013." and the same line without the
// trailing full stop normalize to the same string.
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’“”]/g, "'") // smart quotes → plain
    .replace(/[^a-z0-9\s]/g, " ") // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(normalize(text).split(" ").filter(Boolean));
}

// Jaccard similarity of two token sets: |A ∩ B| / |A ∪ B|, in [0, 1].
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Does `req` belong to the group already anchored by `rep`? Conservative two-tier
// test (see the module header). `repTokens` is precomputed for the representative.
function isSameRequirement(
  rep: Requirement,
  repTokens: Set<string>,
  req: Requirement
): boolean {
  if (rep.is_gating !== req.is_gating) return false;

  // Tier A — exact normalized-text equality (category-agnostic on purpose).
  if (normalize(rep.text) === normalize(req.text)) return true;

  // Deal-breakers are NEVER folded on a fuzzy signal. Two differently-worded gating
  // requirements (e.g. a PQQ gate vs an ITT gate) can be genuinely distinct
  // disqualifiers, and hiding one behind another is the single failure this tool
  // must never make. So gating rows collapse via Tier A (exact text) only.
  if (rep.is_gating) return false;

  // Tier B — high token overlap, but only within the same category (non-gating only).
  if (rep.category !== req.category) return false;
  return jaccard(repTokens, tokenSet(req.text)) >= JACCARD_THRESHOLD;
}

// Pick the representative of a group of duplicates: highest confidence wins, and
// ties break to the earliest source page (then, for total determinism, the first
// seen). This keeps the most trustworthy, earliest-cited wording on screen.
function pickRepresentative(members: Requirement[]): Requirement {
  return members.reduce((best, cur) => {
    if (cur.confidence > best.confidence) return cur;
    if (cur.confidence < best.confidence) return best;
    if (cur.source_page < best.source_page) return cur;
    return best;
  });
}

// Collapse a list of requirements to one representative per unique requirement.
// Pure: returns new structures, mutates nothing, discards nothing. Grouping uses a
// stable single pass (each item joins the first group it matches), so the result
// is deterministic and order-preserving by first appearance.
export function collapseDuplicates(reqs: Requirement[]): CollapsedResult {
  interface Bucket {
    anchor: Requirement;
    anchorTokens: Set<string>;
    members: Requirement[];
  }
  const buckets: Bucket[] = [];

  for (const req of reqs) {
    const bucket = buckets.find((b) =>
      isSameRequirement(b.anchor, b.anchorTokens, req)
    );
    if (bucket) {
      bucket.members.push(req);
    } else {
      buckets.push({
        anchor: req,
        anchorTokens: tokenSet(req.text),
        members: [req],
      });
    }
  }

  const representatives: Requirement[] = [];
  const meta = new Map<string, DedupeMeta>();

  for (const bucket of buckets) {
    const rep = pickRepresentative(bucket.members);
    representatives.push(rep);
    const alsoCitedOn = Array.from(
      new Set(
        bucket.members
          .filter((m) => m.id !== rep.id)
          .map((m) => m.source_page)
          .filter((page) => page !== rep.source_page)
      )
    ).sort((a, b) => a - b);
    meta.set(rep.id, { alsoCitedOn, members: bucket.members });
  }

  return { representatives, meta };
}

// Render helper: "also cited on p.3, p.6" — or "" when the group is a single row.
export function alsoCitedLabel(pages: number[]): string {
  if (pages.length === 0) return "";
  return `also cited on ${pages.map((p) => `p.${p}`).join(", ")}`;
}
