// The Bidframe lockup: a crisp clause frame plus the Fraunces wordmark,
// rendered inline so it inherits the page's loaded Fraunces and costs no extra
// request.
export function BrandLogo({
  reversed = false,
  className = "",
}: {
  reversed?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 312 64"
      className={className}
      role="img"
      aria-label="Bidframe"
      fill="none"
    >
      <title>Bidframe</title>
      <rect
        x="7"
        y="7"
        width="50"
        height="50"
        stroke={reversed ? "#f6f2e9" : "#211d17"}
        strokeWidth="6"
        strokeLinejoin="miter"
      />
      <path
        stroke={reversed ? "#f6f2e9" : "#211d17"}
        strokeWidth="5"
        strokeLinecap="square"
        d="M18 27H44M18 38H48"
      />
      {/* The wordmark fills its box: bold Fraunces at 46px in a 64px viewBox,
          so the lockup reads at a distance instead of floating in whitespace. */}
      <text
        x="76"
        y="47"
        fontFamily="var(--font-head), Fraunces, Georgia, serif"
        fontWeight="700"
        fontSize="46"
        letterSpacing="-0.5"
        fill={reversed ? "#f6f2e9" : "#211d17"}
      >
        Bidframe
      </text>
    </svg>
  );
}
