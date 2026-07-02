// A horizontal pine branch in the landing's engraving language, laid along the
// lower hero edge and behind the closing card (the quiet conifer counterpart
// to the fern). One wandering branch carries four upward offshoots and a short
// downward twig, each ending in a fan of gently bowed needle strokes, with two
// hanging cones built from rows of overlapping scale strokes. Every path
// carries pathLength={1} so the draw-on CSS can animate strokes with a single
// dasharray rule. Purely decorative, so it is aria-hidden; colour comes from
// the parent via currentColor, position and opacity from the className.

export function PineBranch({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 200"
      fill="none"
      aria-hidden="true"
      className={`art-lines ${className}`}
    >
      <g
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* the main branch, wandering from the cut end to the growing tip */}
        <path pathLength={1} d="M8 114C70 107 132 101 196 97 250 93.6 294 91.4 330 90" />

        {/* offshoots up to the needle clusters, plus one downward twig */}
        <path pathLength={1} d="M56 109C62 101 68 92.5 74 84" />
        <path pathLength={1} d="M128 103C135 88 143 72 150 58" />
        <path pathLength={1} d="M222 96C228 86 234 76 240 66" />
        <path pathLength={1} d="M300 91.5C305 89.8 310 87.9 314 86" />
        <path pathLength={1} d="M186 98C191 114 194 131 196 148" />

        {/* stalks carrying the two cones below the branch */}
        <path pathLength={1} d="M104 106.5C109 113 113.5 119.5 117 126" />
        <path pathLength={1} d="M262 93.5C267.5 101 272.5 108.5 276.5 116" />

        {/* needle fans, one cluster per offshoot, cut end to tip */}
        <path pathLength={1} d="M74 84Q65.8 80.5 58.4 80.4" />
        <path pathLength={1} d="M74 84Q64.2 77 54.9 73.9" />
        <path pathLength={1} d="M74 84Q65.1 73.7 55.8 67.4" />
        <path pathLength={1} d="M74 84Q67.5 70.9 59.7 61.8" />
        <path pathLength={1} d="M74 84Q70.9 69.4 65.7 58.3" />
        <path pathLength={1} d="M74 84Q74.8 69.4 72.5 57.6" />
        <path pathLength={1} d="M74 84Q78.3 71 78.9 59.9" />
        <path pathLength={1} d="M74 84Q80.7 74 83.6 64.6" />
        <path pathLength={1} d="M74 84Q81 78.4 84.5 71.9" />

        <path pathLength={1} d="M150 58Q143.1 51.4 135.9 48.5" />
        <path pathLength={1} d="M150 58Q143.1 47.5 135.2 40.9" />
        <path pathLength={1} d="M150 58Q145.4 44.6 139 34.9" />
        <path pathLength={1} d="M150 58Q148.9 42.9 145.1 31" />
        <path pathLength={1} d="M150 58Q152.9 42.8 152.4 30.1" />
        <path pathLength={1} d="M150 58Q156.7 44.4 159.5 32.3" />
        <path pathLength={1} d="M150 58Q159.5 47.5 164.9 37.1" />
        <path pathLength={1} d="M150 58Q160.6 51.4 167.5 43.7" />
        <path pathLength={1} d="M150 58Q159.2 55.7 165.5 51.1" />

        <path pathLength={1} d="M240 66Q235.4 58.3 229.5 53.9" />
        <path pathLength={1} d="M240 66Q236.2 54.6 230.4 46.6" />
        <path pathLength={1} d="M240 66Q238.9 52.4 235.1 41.9" />
        <path pathLength={1} d="M240 66Q242.4 51.6 241.5 39.6" />
        <path pathLength={1} d="M240 66Q246.1 52.4 248.3 40.3" />
        <path pathLength={1} d="M240 66Q249.2 54.7 254.3 43.8" />
        <path pathLength={1} d="M240 66Q251.1 58 258.2 49.4" />
        <path pathLength={1} d="M240 66Q251.3 61.9 259.1 55.9" />
        <path pathLength={1} d="M240 66Q248.9 65.6 255.6 62.4" />

        <path pathLength={1} d="M314 86Q312.1 77.8 307.9 72.3" />
        <path pathLength={1} d="M314 86Q314.1 74.9 311.2 66.2" />
        <path pathLength={1} d="M314 86Q317.3 73.9 317.1 63.6" />
        <path pathLength={1} d="M314 86Q320.8 74.7 323.7 64.2" />
        <path pathLength={1} d="M314 86Q323.7 77 329.3 67.7" />
        <path pathLength={1} d="M314 86Q325.2 80.4 332.7 73.4" />
        <path pathLength={1} d="M314 86Q325 84.1 333 79.8" />
        <path pathLength={1} d="M314 86Q322.3 87.3 329 85.5" />

        <path pathLength={1} d="M196 148Q200 154.1 205.4 157" />
        <path pathLength={1} d="M196 148Q199.3 157.4 204.6 163.7" />
        <path pathLength={1} d="M196 148Q196.6 159.2 200 167.8" />
        <path pathLength={1} d="M196 148Q193.2 159.3 193.8 168.9" />
        <path pathLength={1} d="M196 148Q190.1 157.6 188 166.6" />
        <path pathLength={1} d="M196 148Q188.4 154.4 184.3 161.6" />
        <path pathLength={1} d="M196 148Q189.1 150.4 185 154.9" />

        {/* the first cone, rows of overlapping scales from crown to tip */}
        <path pathLength={1} d="M112.8 128Q114.4 132.2 116.1 128" />
        <path pathLength={1} d="M116.4 128Q118 132.2 119.6 128" />
        <path pathLength={1} d="M119.9 128Q121.6 132.2 123.2 128" />
        <path pathLength={1} d="M109.3 134.5Q113.5 138.7 117.6 134.5" />
        <path pathLength={1} d="M118.4 134.5Q122.5 138.7 126.7 134.5" />
        <path pathLength={1} d="M108.3 141Q111.4 145.2 114.4 141" />
        <path pathLength={1} d="M115 141Q118 145.2 121 141" />
        <path pathLength={1} d="M121.6 141Q124.6 145.2 127.7 141" />
        <path pathLength={1} d="M110.6 147.5Q114.1 151.7 117.7 147.5" />
        <path pathLength={1} d="M118.3 147.5Q121.9 151.7 125.4 147.5" />
        <path pathLength={1} d="M115 154Q115.9 158.2 116.9 154" />
        <path pathLength={1} d="M117.1 154Q118 158.2 118.9 154" />
        <path pathLength={1} d="M119.1 154Q120.1 158.2 121 154" />

        {/* the second cone, slightly higher on the branch */}
        <path pathLength={1} d="M271.8 118Q273.4 122.2 275.1 118" />
        <path pathLength={1} d="M275.4 118Q277 122.2 278.6 118" />
        <path pathLength={1} d="M278.9 118Q280.6 122.2 282.2 118" />
        <path pathLength={1} d="M268.3 124.5Q272.5 128.7 276.6 124.5" />
        <path pathLength={1} d="M277.4 124.5Q281.5 128.7 285.7 124.5" />
        <path pathLength={1} d="M267.3 131Q270.4 135.2 273.4 131" />
        <path pathLength={1} d="M274 131Q277 135.2 280 131" />
        <path pathLength={1} d="M280.6 131Q283.6 135.2 286.7 131" />
        <path pathLength={1} d="M269.6 137.5Q273.1 141.7 276.7 137.5" />
        <path pathLength={1} d="M277.3 137.5Q280.9 141.7 284.4 137.5" />
        <path pathLength={1} d="M274 144Q274.9 148.2 275.9 144" />
        <path pathLength={1} d="M276.1 144Q277 148.2 277.9 144" />
        <path pathLength={1} d="M278.1 144Q279.1 148.2 280 144" />
      </g>
    </svg>
  );
}
