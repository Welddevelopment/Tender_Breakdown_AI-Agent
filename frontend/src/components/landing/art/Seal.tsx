import { BotanicalSprig } from "../BotanicalSprig";

// A circular civic seal: two engraved rings with the promise "BIDFRAME ·
// EVERY CLAIM TO SOURCE ·" set in mono around a hidden middle circle, and the
// laurel sprig centred inside. The ring text is distributed evenly with
// textLength (402 = the circumference of the r64 text circle); Safari renders
// textLength on textPath loosely, in which case the letterSpacing alone keeps
// it acceptable. The id prop keys the textPath's circle, so it must be unique
// per instance (server components cannot use useId). Purely decorative, so
// the whole thing is aria-hidden; colour comes from the parent via
// currentColor, size, opacity and positioning from the className. The caller
// must make the wrapper positioned (relative or absolute, both establish a
// containing block) so the sprig overlay resolves against it; hardcoding
// relative here would override an absolute passed in by the caller.

export function Seal({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={className}>
      {/* art-lines admits the ring strokes (which carry pathLength) to the
          draw-on rules; the overlaid sprig is its own svg without the class,
          so its unmeasured paths are never armed */}
      <svg
        viewBox="0 0 160 160"
        fill="none"
        className="art-lines block h-full w-full"
      >
        <defs>
          {/* the invisible circle the ring text follows, starting at twelve
              o'clock so the wordmark sits at the top of the seal */}
          <path id={id} d="M80 16a64 64 0 1 1-.01 0" />
        </defs>
        <g stroke="currentColor" strokeLinecap="round">
          <path pathLength={1} strokeWidth="1.5" d="M80 4a76 76 0 1 1-.01 0Z" />
          <path pathLength={1} strokeWidth="1" d="M80 28a52 52 0 1 1-.01 0Z" />
        </g>
        <text
          className="font-mono"
          fontSize="11.5"
          letterSpacing="2"
          fill="currentColor"
        >
          <textPath href={`#${id}`} textLength="402" lengthAdjust="spacing">
            BIDFRAME &#183; EVERY CLAIM TO SOURCE &#183;
          </textPath>
        </text>
      </svg>
      {/* the sprig is overlaid in HTML rather than nested SVG so it keeps its
          own viewBox and stroke weight at any seal size */}
      <div className="absolute inset-0 flex items-center justify-center">
        <BotanicalSprig className="h-[38%] w-[38%]" />
      </div>
    </div>
  );
}
