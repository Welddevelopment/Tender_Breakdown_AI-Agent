// A treeline horizon used as the seam between the paper page and the pine
// bands (and, flipped, between pine and the pine-deep footer). One filled
// silhouette in currentColor: fourteen irregular trees, mixing steep stepped
// conifers with low broadleaf shoulders and flat gaps, on a baseline that
// wanders between 68 and 78 so it reads as a real horizon rather than a
// sawtooth or a repeating pattern. `preserveAspectRatio="xMidYMax slice"`
// crops the ridge from the centre on narrow viewports instead of squashing
// it; the path closes down to y=96 at both corners so the fill always meets
// the band below without a seam. Purely decorative, so aria-hidden; consumers
// set the tree colour via text-* and, when the divider sits between two
// bands, paint the sky behind it with a bg-* on the same element.

const RIDGE =
  "M0 74L28 74L40 63L35 67L48 51L43 56L52 40L62 56L57 51L71 66L66 62L80 73L138 75L151 59L144 63L159 42L152 47L167 26L160 31L170 10L180 30L173 26L189 46L182 42L198 62L191 57L206 73L224 73Q248 58 256 53Q270 50 284 54Q300 59 324 76L372 76L385 60L379 64L393 43L388 48L398 27L409 47L404 43L420 63L414 58L430 74L436 74L450 57L443 62L458 40L451 44L467 23L460 28L470 6L481 27L473 22L490 43L483 38L500 59L492 55L508 71L556 70Q585 54 606 49Q623 46 640 50Q649 55 678 73L692 73L706 58L701 62L713 43L726 63L722 58L738 74L834 77L848 61L841 65L856 44L849 49L865 28L858 33L868 12L878 32L871 28L887 48L880 43L896 63L889 58L904 74L916 74L928 59L923 64L937 45L931 49L941 30L952 49L946 44L962 63L957 59L972 73L994 73Q1017 60 1031 55Q1045 52 1058 56Q1067 61 1090 75L1148 72L1163 55L1155 60L1172 38L1164 42L1181 21L1173 26L1184 4L1195 26L1188 22L1205 44L1198 39L1215 61L1208 56L1224 74L1242 74Q1258 64 1263 59Q1273 56 1282 60Q1294 65 1310 75L1358 75L1371 58L1365 62L1380 41L1374 46L1385 24L1397 45L1391 40L1408 61L1402 57L1418 73L1432 73L1447 58L1442 63L1454 44L1468 64L1463 59L1480 74L1600 74V96H0Z";

export function TreelineDivider({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  const path = <path fill="currentColor" d={RIDGE} />;
  return (
    <svg
      viewBox="0 0 1600 96"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={className}
    >
      {/* flip mirrors the ridge about its vertical centre, so the same
          drawing can appear twice on one page without visibly repeating */}
      {flip ? <g transform="translate(1600 0) scale(-1 1)">{path}</g> : path}
    </svg>
  );
}
