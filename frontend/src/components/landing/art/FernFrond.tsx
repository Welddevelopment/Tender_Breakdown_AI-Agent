// A large fern frond in the landing's engraving language, drawn to bleed off
// the hero's edge (the forest walking into the document, not a sticker on it).
// One arching rachis rises from the base with alternating pinnae pairs that
// shrink toward a terminal leaflet. The frond is truly pinnate: each of the
// ten lower pinnae carries its own midrib with a run of small alternating
// pinnules that shrink toward the pinna tip, and only the uppermost pinnae
// taper to entire lanceolate leaflets, the way a real frond simplifies as it
// climbs. Stroke weight, faint currentColor bodies and round caps match
// BotanicalSprig; every path carries pathLength={1} so the draw-on CSS can
// animate strokes with a single dasharray rule. Purely decorative, so it is
// aria-hidden; colour comes from the parent via currentColor, position and
// opacity from the className.

export function FernFrond({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 460"
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
        {/* the rachis, arching from the base up and over to the tip */}
        <path pathLength={1} d="M92 452C72 326 122 160 178 40" />

        {/* midribs of the ten subdivided lower pinnae, base to tip */}
        <path pathLength={1} d="M89.3 430.9 142.3 389.4" />
        <path pathLength={1} d="M88.4 419.8 29.5 387.5" />
        <path pathLength={1} d="M87.5 389.6 137.8 356.5" />
        <path pathLength={1} d="M87.7 378 38.5 343.3" />
        <path pathLength={1} d="M89.5 346.6 135.9 320.2" />
        <path pathLength={1} d="M90.7 334.7 50.2 299.9" />
        <path pathLength={1} d="M94.9 302.5 136.6 281.5" />
        <path pathLength={1} d="M96.9 290.4 64.2 257.1" />
        <path pathLength={1} d="M103.3 257.8 139.8 241.3" />
        <path pathLength={1} d="M106 245.7 80.2 215.1" />

        {/* pinnules along those midribs: small alternating leaflets that
            shrink outward, each run closed by a terminal leaflet */}
        <g fill="currentColor" fillOpacity="0.08">
          <path pathLength={1} d="M95.7 425.9Q101.1 431.2 108.2 428.6Q102.8 423.2 95.7 425.9Z" />
          <path pathLength={1} d="M102 420.9Q106 415.1 102.4 409Q98.4 414.9 102 420.9Z" />
          <path pathLength={1} d="M108.4 416Q113 420.6 119.2 418.2Q114.5 413.6 108.4 416Z" />
          <path pathLength={1} d="M114.7 411Q118.2 406 115.1 400.8Q111.7 405.8 114.7 411Z" />
          <path pathLength={1} d="M121.1 406Q125 409.9 130.2 407.9Q126.2 404.1 121.1 406Z" />
          <path pathLength={1} d="M127.5 401Q130.3 396.9 127.7 392.7Q124.9 396.7 127.5 401Z" />
          <path pathLength={1} d="M133.8 396Q137 399.2 141.1 397.6Q138 394.5 133.8 396Z" />
          <path pathLength={1} d="M137 393.5Q141.7 393.2 143.1 388.8Q138.4 389.1 137 393.5Z" />

          <path pathLength={1} d="M81.3 415.9Q84.1 408.9 78.8 403.4Q76.1 410.5 81.3 415.9Z" />
          <path pathLength={1} d="M74.3 412Q67.3 410.7 63.2 416.4Q70.1 417.7 74.3 412Z" />
          <path pathLength={1} d="M67.2 408.2Q69.6 402.1 65 397.4Q62.7 403.5 67.2 408.2Z" />
          <path pathLength={1} d="M60.1 404.3Q54.2 403.1 50.7 408Q56.6 409.1 60.1 404.3Z" />
          <path pathLength={1} d="M53.1 400.4Q55.1 395.3 51.3 391.4Q49.3 396.5 53.1 400.4Z" />
          <path pathLength={1} d="M46 396.5Q41.1 395.6 38.2 399.6Q43.1 400.6 46 396.5Z" />
          <path pathLength={1} d="M38.9 392.7Q40.5 388.5 37.5 385.3Q35.8 389.5 38.9 392.7Z" />
          <path pathLength={1} d="M35.4 390.7Q33.3 386.5 28.6 387Q30.7 391.2 35.4 390.7Z" />

          <path pathLength={1} d="M93.5 385.6Q98 390.8 104.5 388.9Q100.1 383.8 93.5 385.6Z" />
          <path pathLength={1} d="M99.6 381.7Q103.6 376.8 100.8 371.1Q96.8 376 99.6 381.7Z" />
          <path pathLength={1} d="M105.6 377.7Q109.4 382.1 115.1 380.5Q111.2 376.1 105.6 377.7Z" />
          <path pathLength={1} d="M111.6 373.7Q115.1 369.5 112.7 364.7Q109.3 368.9 111.6 373.7Z" />
          <path pathLength={1} d="M117.7 369.7Q120.9 373.5 125.6 372.1Q122.4 368.4 117.7 369.7Z" />
          <path pathLength={1} d="M123.7 365.8Q126.5 362.3 124.6 358.3Q121.8 361.8 123.7 365.8Z" />
          <path pathLength={1} d="M129.8 361.8Q132.3 364.8 136.2 363.7Q133.6 360.7 129.8 361.8Z" />
          <path pathLength={1} d="M132.8 359.8Q137 359.9 138.6 356Q134.4 355.9 132.8 359.8Z" />

          <path pathLength={1} d="M81.8 373.8Q85 367.8 80.8 362.4Q77.7 368.4 81.8 373.8Z" />
          <path pathLength={1} d="M75.9 369.7Q69.9 367.7 65.6 372.4Q71.6 374.3 75.9 369.7Z" />
          <path pathLength={1} d="M70 365.5Q72.7 360.3 69.2 355.7Q66.4 360.9 70 365.5Z" />
          <path pathLength={1} d="M64.1 361.3Q59 359.7 55.3 363.7Q60.4 365.3 64.1 361.3Z" />
          <path pathLength={1} d="M58.2 357.2Q60.5 352.8 57.5 348.9Q55.2 353.3 58.2 357.2Z" />
          <path pathLength={1} d="M52.3 353Q48 351.7 45 354.9Q49.3 356.3 52.3 353Z" />
          <path pathLength={1} d="M46.4 348.9Q48.2 345.3 45.8 342.2Q44 345.7 46.4 348.9Z" />
          <path pathLength={1} d="M43.4 346.8Q41.9 342.8 37.7 342.8Q39.2 346.7 43.4 346.8Z" />

          <path pathLength={1} d="M95.1 343.4Q98.7 348.2 104.6 347Q101 342.2 95.1 343.4Z" />
          <path pathLength={1} d="M101.7 339.6Q105.5 335.6 103.4 330.5Q99.7 334.5 101.7 339.6Z" />
          <path pathLength={1} d="M108.4 335.8Q111.5 339.8 116.4 338.8Q113.3 334.8 108.4 335.8Z" />
          <path pathLength={1} d="M115.1 332Q118.2 328.7 116.5 324.5Q113.4 327.8 115.1 332Z" />
          <path pathLength={1} d="M121.8 328.2Q124.2 331.4 128.2 330.6Q125.7 327.4 121.8 328.2Z" />
          <path pathLength={1} d="M128.5 324.4Q130.9 321.8 129.5 318.6Q127.1 321.2 128.5 324.4Z" />
          <path pathLength={1} d="M131.3 322.8Q135 323.1 136.6 319.8Q132.9 319.5 131.3 322.8Z" />

          <path pathLength={1} d="M85.8 330.5Q89.1 325.5 86 320.4Q82.7 325.4 85.8 330.5Z" />
          <path pathLength={1} d="M80 325.5Q74.9 323.3 70.8 327Q75.9 329.2 80 325.5Z" />
          <path pathLength={1} d="M74.2 320.5Q76.9 316.3 74.3 312Q71.5 316.2 74.2 320.5Z" />
          <path pathLength={1} d="M68.3 315.5Q64.2 313.7 60.8 316.7Q65 318.5 68.3 315.5Z" />
          <path pathLength={1} d="M62.5 310.5Q64.7 307.1 62.6 303.7Q60.4 307.1 62.5 310.5Z" />
          <path pathLength={1} d="M56.7 305.5Q53.4 304.1 50.8 306.4Q54.1 307.8 56.7 305.5Z" />
          <path pathLength={1} d="M54.2 303.4Q53.3 299.8 49.6 299.4Q50.5 303 54.2 303.4Z" />

          <path pathLength={1} d="M99.9 300Q102.9 304.3 108.1 303.5Q105.1 299.1 99.9 300Z" />
          <path pathLength={1} d="M107.4 296.2Q110.8 292.9 109.2 288.5Q105.8 291.7 107.4 296.2Z" />
          <path pathLength={1} d="M114.9 292.4Q117.3 295.9 121.4 295.2Q119 291.7 114.9 292.4Z" />
          <path pathLength={1} d="M122.4 288.6Q125 286.1 123.8 282.7Q121.2 285.2 122.4 288.6Z" />
          <path pathLength={1} d="M129.9 284.9Q131.7 287.4 134.7 286.9Q133 284.4 129.9 284.9Z" />
          <path pathLength={1} d="M132.4 283.6Q135.7 284 137.3 281.2Q134 280.7 132.4 283.6Z" />

          <path pathLength={1} d="M93 286.4Q96.2 282.3 93.8 277.6Q90.6 281.7 93 286.4Z" />
          <path pathLength={1} d="M87.1 280.4Q82.9 278.2 79.2 281Q83.3 283.3 87.1 280.4Z" />
          <path pathLength={1} d="M81.2 274.4Q83.8 271.1 81.9 267.4Q79.3 270.7 81.2 274.4Z" />
          <path pathLength={1} d="M75.3 268.4Q72.1 266.7 69.2 268.9Q72.4 270.6 75.3 268.4Z" />
          <path pathLength={1} d="M69.4 262.4Q71.3 260 69.9 257.3Q68 259.7 69.4 262.4Z" />
          <path pathLength={1} d="M67.5 260.4Q66.9 257.2 63.7 256.6Q64.3 259.8 67.5 260.4Z" />

          <path pathLength={1} d="M107.7 255.8Q110.1 259.7 114.5 259.1Q112.2 255.3 107.7 255.8Z" />
          <path pathLength={1} d="M114.2 252.9Q117.3 250.2 116.1 246.3Q113.1 249 114.2 252.9Z" />
          <path pathLength={1} d="M120.8 249.9Q122.7 252.9 126.3 252.5Q124.4 249.4 120.8 249.9Z" />
          <path pathLength={1} d="M127.4 246.9Q129.7 244.8 128.8 241.9Q126.5 243.9 127.4 246.9Z" />
          <path pathLength={1} d="M134 243.9Q135.4 246.2 138 245.9Q136.6 243.6 134 243.9Z" />
          <path pathLength={1} d="M136.2 243Q138.9 243.4 140.4 241Q137.6 240.6 136.2 243Z" />

          <path pathLength={1} d="M102.9 242Q106 238.7 104.2 234.5Q101.2 237.9 102.9 242Z" />
          <path pathLength={1} d="M98.3 236.5Q94.8 234.3 91.4 236.5Q94.9 238.7 98.3 236.5Z" />
          <path pathLength={1} d="M93.6 231Q96 228.4 94.6 225.1Q92.2 227.7 93.6 231Z" />
          <path pathLength={1} d="M89 225.5Q86.3 223.8 83.7 225.5Q86.4 227.2 89 225.5Z" />
          <path pathLength={1} d="M84.3 220Q86.1 218 85.1 215.6Q83.3 217.6 84.3 220Z" />
          <path pathLength={1} d="M82.8 218.2Q82.5 215.4 79.8 214.6Q80.1 217.4 82.8 218.2Z" />
        </g>

        {/* the uppermost pinnae, tapering to entire leaflets at the tip */}
        <g fill="currentColor" fillOpacity="0.08">
          <path
            pathLength={1}
            d="M114.2 213.2C125.4 215.4 138.6 208.6 145.4 200.3C134.7 199.3 120.6 203.8 114.2 213.2Z"
          />
          <path
            pathLength={1}
            d="M117.6 201.2C117.1 189.9 107.3 178.6 97.6 174C99.2 184.6 107 197.3 117.6 201.2Z"
          />
          <path
            pathLength={1}
            d="M127.3 169.2C136.4 171.2 147.3 165.9 153.1 159.3C144.4 158.2 132.7 161.6 127.3 169.2Z"
          />
          <path
            pathLength={1}
            d="M131.2 157.4C131.3 148.1 123.9 138.5 116.3 134.2C117 142.9 122.7 153.7 131.2 157.4Z"
          />
          <path
            pathLength={1}
            d="M142.1 126.2C149.2 128 157.9 124.1 162.6 119C155.7 117.9 146.5 120.4 142.1 126.2Z"
          />
          <path
            pathLength={1}
            d="M146.4 114.9C146.9 107.6 141.5 99.7 135.7 96C135.9 102.9 139.9 111.6 146.4 114.9Z"
          />
          <path
            pathLength={1}
            d="M158.2 85C163.5 86.5 170.1 83.7 173.6 79.9C168.5 79 161.6 80.7 158.2 85Z"
          />
          <path
            pathLength={1}
            d="M162.7 74.2C163.5 68.8 159.8 62.7 155.6 59.6C155.4 64.8 158 71.5 162.7 74.2Z"
          />
          <path
            pathLength={1}
            d="M172.1 52.8C177.8 49.2 180.8 40.9 180.4 34.5C175.3 38.4 171.1 46.1 172.1 52.8Z"
          />
        </g>

        {/* midrib veins for the entire upper pinnae, base to tip */}
        <path pathLength={1} d="M114.2 213.2 138.5 203.2" />
        <path pathLength={1} d="M117.6 201.2 102 180" />
        <path pathLength={1} d="M127.3 169.2 147.4 161.5" />
        <path pathLength={1} d="M131.2 157.4 119.6 139.3" />
        <path pathLength={1} d="M142.1 126.2 158.1 120.6" />
        <path pathLength={1} d="M146.4 114.9 138.1 100.1" />
        <path pathLength={1} d="M158.2 85 170.2 81.1" />
        <path pathLength={1} d="M162.7 74.2 157.2 62.9" />
        <path pathLength={1} d="M172.1 52.8 178.6 38.5" />
      </g>
    </svg>
  );
}
