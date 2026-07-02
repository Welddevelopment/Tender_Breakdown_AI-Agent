// The confidence indicator (DESIGN-SYSTEM section 4, axis 1). Four tiers, worst
// to best, carried by an evidence stamp rather than a number.
//
// The stamp reads as source quality: a missing-source slash, then one/two/three
// proof strokes. The count makes the level greyscale-legible, while the hue only
// reinforces the status. Shared everywhere: the matrix, the spine, the panel,
// and the landing examples. The word beside it uses the fixed four-tier lexicon
// (copywriting.md).

export type ConfidenceTier = "oxblood" | "amber" | "yellow" | "light-green";

const TIER_WORD: Record<ConfidenceTier, string> = {
  oxblood: "Can't answer this",
  amber: "Low confidence",
  yellow: "Fairly sure",
  "light-green": "Confident",
};

// A plain one-line gloss per tier, so a first-time reader trusts the signal
// without a number. Additive only: it feeds the hover title and the aria-label
// (a little beyond the single tier word), never the visible lexicon or shapes.
const TIER_DESCRIPTION: Record<ConfidenceTier, string> = {
  oxblood:
    "Can't answer this. We found no source we can stand behind, check it yourself.",
  amber: "Low confidence. Worth a closer look.",
  yellow: "Fairly sure. A quick check is wise.",
  "light-green": "Confident. Matched to the tender.",
};

// The hue for the stamp.
const TIER_HEX: Record<ConfidenceTier, string> = {
  oxblood: "#b42d24",
  amber: "#bc6b2e",
  yellow: "#d2a435",
  "light-green": "#6f9a57",
};

const TIER_PROOF_LINES: Record<Exclude<ConfidenceTier, "oxblood">, number> = {
  amber: 1,
  yellow: 2,
  "light-green": 3,
};

// confidence -> tier, the single source both the stamp and the row wash read
// from. An explicit unanswerable case (a gating item with no good answer) forces
// oxblood regardless of the raw number. needs_review never reads better than
// amber: a flagged-for-review item is at most a rough draft.
export function confidenceTier(
  confidence: number,
  {
    needsReview = false,
    unanswerable = false,
  }: { needsReview?: boolean; unanswerable?: boolean } = {}
): ConfidenceTier {
  const raw: ConfidenceTier =
    unanswerable || confidence < 0.4
      ? "oxblood"
      : confidence < 0.6
        ? "amber"
        : confidence < 0.8
          ? "yellow"
          : "light-green";
  return needsReview && (raw === "yellow" || raw === "light-green")
    ? "amber"
    : raw;
}

function EvidenceStamp({
  tier,
  hex,
  size,
}: {
  tier: ConfidenceTier;
  hex: string;
  size: "sm" | "md";
}) {
  const s = size === "sm" ? 18 : 22;
  const lines =
    tier === "oxblood" ? 0 : TIER_PROOF_LINES[tier as Exclude<ConfidenceTier, "oxblood">];
  const fill = `color-mix(in oklab, ${hex} 12%, var(--color-paper-raised))`;

  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3.75"
        y="3.75"
        width="16.5"
        height="16.5"
        rx="3.25"
        fill={fill}
        stroke={hex}
        strokeWidth="1.6"
      />
      <rect
        x="6.35"
        y="6.35"
        width="11.3"
        height="11.3"
        rx="2"
        stroke={hex}
        strokeWidth="0.9"
        opacity="0.38"
      />
      {tier === "oxblood" ? (
        <path
          d="M8 16 16 8"
          stroke={hex}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ) : (
        Array.from({ length: lines }).map((_, i) => (
          <path
            key={i}
            d={`M8 ${9.2 + i * 3.05}h8`}
            stroke={hex}
            strokeWidth={i === lines - 1 ? 2 : 1.45}
            strokeLinecap="round"
          />
        ))
      )}
    </svg>
  );
}

export function ConfidenceIndicator({
  confidence,
  needsReview = false,
  unanswerable = false,
  variant = "word",
  size = "md",
}: {
  confidence: number;
  needsReview?: boolean;
  unanswerable?: boolean;
  variant?: "dot" | "word";
  size?: "sm" | "md";
}) {
  const tier = confidenceTier(confidence, { needsReview, unanswerable });

  const word = TIER_WORD[tier];
  const description = TIER_DESCRIPTION[tier];
  const hex = TIER_HEX[tier];

  const glyph = <EvidenceStamp tier={tier} hex={hex} size={size} />;

  if (variant === "dot") {
    return (
      <span
        className="inline-flex items-center"
        title={description}
        aria-label={description}
        role="img"
      >
        {glyph}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-2.5 whitespace-nowrap text-sm text-ink-muted"
      title={description}
    >
      {glyph}
      <span>{word}</span>
    </span>
  );
}
