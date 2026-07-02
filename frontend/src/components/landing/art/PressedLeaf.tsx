// A small pressed-leaf section mark in the landing's engraving language, sized
// to sit quietly beside a section heading the way a specimen sits beside its
// label. Two variants: "oak" is a single lobed leaf with a short stem, midrib
// and paired side veins; "fern" is a miniature frond, one arching rachis with
// three shrinking pinnae pairs. Every path carries pathLength={1} so the
// draw-on CSS can animate strokes with a single dasharray rule. Purely
// decorative, so it is aria-hidden; colour comes from the parent via
// currentColor, position and opacity from the className.

export function PressedLeaf({
  className = "",
  variant = "oak",
}: {
  className?: string;
  variant?: "oak" | "fern";
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={`art-lines ${className}`}
    >
      <g
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {variant === "oak" ? (
          <>
            {/* stem, then the lobed outline with a faint fill for body */}
            <path pathLength={1} d="M20 37C20 35 20 33 20 31" />
            <path
              pathLength={1}
              fill="currentColor"
              fillOpacity="0.08"
              d="M20 31C16 31.6 13 29.4 13.4 26.6 10.8 25.4 10.2 22.4 12.4 21 10.6 19 11.4 16 14 15.2 13.4 12.4 15.4 9.8 18 10 18.4 8.2 19.2 7.4 20 7 20.8 7.4 21.6 8.2 22 10 24.6 9.8 26.6 12.4 26 15.2 28.6 16 29.4 19 27.6 21 29.8 22.4 29.2 25.4 26.6 26.6 27 29.4 24 31.6 20 31Z"
            />
            {/* midrib and paired side veins reaching into the lobes */}
            <path pathLength={1} d="M20 31C20 24 20 17 20 10" />
            <path pathLength={1} d="M20 25.5 14.8 24" />
            <path pathLength={1} d="M20 25.5 25.2 24" />
            <path pathLength={1} d="M20 18.5 14.6 16.5" />
            <path pathLength={1} d="M20 18.5 25.4 16.5" />
            <path pathLength={1} d="M20 13 16.6 11.4" />
            <path pathLength={1} d="M20 13 23.4 11.4" />
          </>
        ) : (
          <>
            {/* miniature rachis, arching from the base toward the tip */}
            <path pathLength={1} d="M13 35C14.5 25.5 19.5 14.5 27.5 6" />
            {/* lowest pinnae pair, with faint bodies like the large frond */}
            <path
              pathLength={1}
              fill="currentColor"
              fillOpacity="0.08"
              d="M14.1 29C10.7 30 6.9 28.2 5 25.4 8.4 24.4 12.3 26 14.1 29Z"
            />
            <path
              pathLength={1}
              fill="currentColor"
              fillOpacity="0.08"
              d="M14.7 26.2C17.9 25 19.8 21.6 19.5 18.6 16.4 19.7 14.2 23 14.7 26.2Z"
            />
            {/* upper pinnae, shrinking to strokes toward the tip */}
            <path pathLength={1} d="M17 20.5Q13.7 19.7 11.6 17.3" />
            <path pathLength={1} d="M18.4 17.5Q20.9 15.2 21.4 12" />
            <path pathLength={1} d="M21.7 12.5Q19.5 11.2 18.6 8.9" />
            <path pathLength={1} d="M23.3 10Q25 8.2 25.3 5.8" />
          </>
        )}
      </g>
    </svg>
  );
}
