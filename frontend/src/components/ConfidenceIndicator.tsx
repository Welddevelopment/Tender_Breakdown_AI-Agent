interface ConfidenceIndicatorProps {
  confidence: number;
  needsReview: boolean;
}

function confidenceLabel(confidence: number, needsReview: boolean): string {
  if (needsReview) return "Uncertain — needs review";
  if (confidence >= 0.85) return "High confidence";
  if (confidence >= 0.65) return "Moderate confidence";
  return "Low confidence";
}

export function ConfidenceIndicator({
  confidence,
  needsReview,
}: ConfidenceIndicatorProps) {
  const pct = Math.round(confidence * 100);

  const barColor = needsReview
    ? "bg-amber-400"
    : confidence >= 0.85
      ? "bg-emerald-500"
      : confidence >= 0.65
        ? "bg-sky-500"
        : "bg-amber-400";

  const dotColor = needsReview
    ? "bg-amber-500"
    : confidence >= 0.85
      ? "bg-emerald-500"
      : confidence >= 0.65
        ? "bg-sky-500"
        : "bg-amber-500";

  return (
    <div
      className="flex items-center gap-2.5 min-w-[7rem]"
      title={confidenceLabel(confidence, needsReview)}
      aria-label={confidenceLabel(confidence, needsReview)}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor} ${needsReview ? "animate-pulse" : ""}`}
        aria-hidden
      />
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${barColor} ${needsReview ? "opacity-70" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
