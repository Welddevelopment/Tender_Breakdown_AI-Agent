// The approval stamp (design-language.md, device 6): a clean forest mark set
// slightly off-axis, the way an officer stamps a form, with the self-writing
// audit line in mono beside it. The slight rotation is the one earned
// imperfection. It settles when motion is allowed and rests at the off-axis
// angle under reduced motion (the inline transform is the static base). Shared:
// the landing's approval moment and the real decision zone use the one device.

// `settle` (default true, so every existing surface is unchanged) applies the
// CSS stamp-settle entrance. The completion summary passes settle={false}
// because it wraps the stamp in its own motion spring — one entrance, not two.
export function ApprovalStamp({
  time = "14:32",
  settle = true,
  by = "you",
}: {
  time?: string;
  settle?: boolean;
  by?: string;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={`${
          settle ? "stamp-settle" : ""
        } inline-flex items-center gap-1.5 rounded-md border-2 border-forest px-2.5 py-1 text-forest [transform:rotate(-3deg)]`}
        aria-hidden="true"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8.5l3.2 3.2L13 4.8"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-mono text-[11px] font-medium uppercase tracking-wide">
          Approved
        </span>
      </span>
      <span className="font-mono text-xs text-ink-muted">
        Approved by {by}, {time}.
      </span>
    </span>
  );
}
