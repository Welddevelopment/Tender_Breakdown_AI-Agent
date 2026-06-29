// A delicate botanical sprig in forest line-art, used to frame the hero and the
// tilted product sheet (a quiet nature note against the warm paper, picking up
// the forest brand). Purely decorative, so it is aria-hidden; colour comes from
// the parent via currentColor, position and opacity from the className.

export function BotanicalSprig({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 74C24 62 38 46 50 26 56 16 63 9 74 5" />
        <path d="M36 45c8 1 14-3 16-11" />
        <path d="M46 33c7 0 12-4 14-11" />
        <path
          d="M31 51c-9 1-15-4-16-13 9-1 15 4 16 13Z"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <path
          d="M41 38c-8 0-13-6-13-14 8 0 13 6 13 14Z"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <path
          d="M51 27c0-8 5-14 13-15 0 8-5 14-13 15Z"
          fill="currentColor"
          fillOpacity="0.1"
        />
      </g>
    </svg>
  );
}
