import type { Requirement } from "@/types/requirement";

// Collaboration presence markers (UI Stage 6): a quiet "N comments" bead and an
// oxblood "blocked" bead, both derived from the server-stamped comment_count /
// open_blocker_count on a requirement. Shared so a matrix row, an answer card,
// and the requirement panel all read collaboration the same way — the discussion
// is visible in the workspace before anyone opens the panel or /teams.
//
// Greyscale rule: each marker carries a glyph + a word, so it survives with
// colour removed (the blocker's oxblood is emphasis, never the only signal).
// Static by design — the live moss-pulse belongs to the panel thread and the
// activity feed, where realtime data backs it; a row count refreshes on load.

function SpeechGlyph() {
  return (
    <svg
      aria-hidden
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// "N comments" — a muted bead. Renders nothing when there are no comments.
export function CommentCountMarker({
  count,
  className = "",
}: {
  count: number | undefined;
  className?: string;
}) {
  if (!count || count <= 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-ink-muted ${className}`}
      title={`${count} team comment${count === 1 ? "" : "s"}`}
    >
      <SpeechGlyph />
      {count} comment{count === 1 ? "" : "s"}
    </span>
  );
}

// "N blocked" — an oxblood bead for UNRESOLVED blocker comments, the one marker
// that reads as "this can't go out yet". Renders nothing when nothing is blocking.
export function BlockerMarker({
  count,
  className = "",
}: {
  count: number | undefined;
  className?: string;
}) {
  if (!count || count <= 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium text-signal-oxblood ${className}`}
      title={`${count} unresolved blocker comment${count === 1 ? "" : "s"}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal-oxblood" />
      {count === 1 ? "Blocked" : `${count} blocked`}
    </span>
  );
}

// Both markers together, in reading order (blocker first — it's the louder
// signal). Convenience for surfaces that want the pair from a requirement.
export function CollaborationMarkers({
  requirement: r,
  className = "",
}: {
  requirement: Requirement;
  className?: string;
}) {
  if (!r.comment_count && !r.open_blocker_count) return null;
  return (
    <span className={`inline-flex items-center gap-x-3 ${className}`}>
      <BlockerMarker count={r.open_blocker_count} />
      <CommentCountMarker count={r.comment_count} />
    </span>
  );
}
