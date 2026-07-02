import Link from "next/link";
import { BookDemoButton, SeeItRunLink } from "./BookDemoButton";
import { HeroResolve } from "./HeroResolve";
import { Reveal } from "./Reveal";
import { DrawOn } from "./DrawOn";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { BrandLogo } from "@/components/BrandLogo";
import { DealBreakerCard, ClauseCard, AnswerCard } from "./ProductShots";
import { ProofNumbers } from "./ProofNumbers";
import { CredibilityBand } from "./CredibilityBand";
import { HowItWorks } from "./HowItWorks";
import { SiteFooter } from "./SiteFooter";
import { FernFrond } from "./art/FernFrond";
import { PineBranch } from "./art/PineBranch";
import { TreelineDivider } from "./art/TreelineDivider";
import { Seal } from "./art/Seal";

// The public landing page (landing-page-brief). It is itself a civic record: the
// same paper, masthead, rules, mono record voice, and real product components as
// the app, so the medium makes the credibility argument before a word is read.
// One job: get a bid writer to book a demo.
//
// The page carries the forest identity end to end. The hero stands on its own
// fading graph paper with two engraved botanicals bleeding in from the edges
// (a fern off the right, a pine branch off the left), the honesty band rests on
// the moss surface, and a treeline seam drops the page onto two pine grounds:
// the proof band and the closing, where the civic seal sits beside the response
// card. The deal-breaker head is the one poster-scale moment before the giant
// proof figures.
//
// Layout follows layout.md and SLOP-CHECK: the content-bearing bands run a real
// two-column split (prose one side, the section's card the other) and alternate
// which side the visual sits on from band to band, so the page has rhythm and no
// dead right column. On mobile everything stacks in source order (text before
// visual). Hierarchy comes from type, space, and three rule weights, not boxes.
// The hero and the closing are the two deliberate centred focal moments; the
// giant proof numbers are the climax, held back to just before the closing CTA.

const CONTAINER = "mx-auto w-full max-w-[1160px] px-6";

const COMPARISON_ROWS = [
  { label: "Time", before: "Weeks of expert reading", after: "Minutes" },
  {
    label: "The deal-breaker",
    before: "A missed gate voids the whole bid",
    after: "Caught and shown first",
  },
  {
    label: "Trust",
    before: "You hope the checklist is complete",
    after: "Every requirement links to its clause",
  },
  {
    label: "Uncertainty",
    before: "Invisible",
    after: "Flagged for you to check",
  },
  {
    label: "Your response",
    before: "A blank page",
    after: "Drafted from your own documents",
  },
  {
    label: "Control",
    before: "",
    after: "You approve, edit, or flag every line",
  },
];

export function Landing() {
  return (
    <div className="landing-scope bg-paper">
      {/* Masthead: a slim warm letterhead carrying the one 2px ink rule and the
          prominent forest CTA. */}
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/85 backdrop-blur-sm">
        <div className={`${CONTAINER} flex items-center justify-between py-3`}>
          <BrandLogo className="h-7 w-auto" />
          <div className="flex items-center gap-5">
            <Link
              href="/demo"
              className="hidden rounded-sm text-sm text-ink-muted underline decoration-hairline decoration-1 underline-offset-4 transition-colors hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:inline"
            >
              See the demo
            </Link>
            <Link
              href="/login"
              className="hidden rounded-sm text-sm text-ink-muted underline decoration-hairline decoration-1 underline-offset-4 transition-colors hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:inline"
            >
              Sign in
            </Link>
            <BookDemoButton location="masthead" />
          </div>
        </div>
      </header>

      <main>
        {/* The hero fold: an immersive forest record. The real product sheet
            stays central and legible while the pine/fern engravings, faint seal
            and low ridge make the first viewport feel discovered inside the
            forest rather than merely decorated by it. */}
        <div className="forest-hero relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <TreelineDivider className="hero-ridge absolute inset-x-0 bottom-0 h-24 w-full text-moss sm:h-32" />
            <TreelineDivider
              flip
              className="hero-canopy absolute -top-10 inset-x-0 hidden h-32 w-full rotate-180 text-forest/[0.08] lg:block"
            />
            <FernFrond className="art-draw absolute -right-20 top-14 hidden h-[620px] w-auto rotate-[7deg] text-forest/[0.22] lg:block" />
            <FernFrond className="art-draw absolute -left-24 top-20 hidden h-[600px] w-auto origin-center -scale-x-100 -rotate-[6deg] text-forest/[0.18] lg:block" />
            <FernFrond className="art-draw absolute -right-10 top-[360px] hidden h-[360px] w-auto rotate-[18deg] text-pine/[0.08] xl:block" />
            <PineBranch className="art-draw absolute -left-20 bottom-24 hidden h-64 w-auto -rotate-[5deg] text-forest/[0.18] lg:block" />
            <PineBranch className="art-draw absolute left-8 top-28 hidden h-36 w-auto rotate-[9deg] text-pine/[0.08] xl:block" />
            <Seal
              id="seal-hero"
              className="absolute left-[7%] top-[44%] hidden h-40 w-40 -translate-y-1/2 -rotate-[8deg] text-forest/[0.06] lg:block"
            />
          </div>

          {/* Hero: a centred two-line headline, a single supporting line, then
              the product sheet. The one symmetric moment, earned. */}
          <section className={`${CONTAINER} relative z-10 pt-16 pb-8 text-center sm:pt-24 sm:pb-12`}>
            <h1 className="hero-enter font-serif font-semibold tracking-tight text-ink">
              <span className="block text-balance text-5xl leading-[1.02] sm:whitespace-nowrap sm:text-6xl md:text-7xl">
                Never lose a bid
              </span>
              <span className="mt-3 block text-balance text-2xl font-medium leading-[1.12] sm:whitespace-nowrap sm:text-3xl md:text-4xl">
                to a deal-breaker you missed.
              </span>
            </h1>
            <p className="hero-enter-2 mx-auto mt-6 max-w-[58ch] text-balance text-lg leading-relaxed text-ink-muted sm:text-xl">
              Bidframe reads the tender, catches disqualifying requirements, and
              links every flag to its exact clause.
            </p>
            <div className="hero-enter-3 mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
              <BookDemoButton location="hero" size="lg" />
              <SeeItRunLink size="lg" />
            </div>
          </section>

          <section className={`${CONTAINER} relative z-10 pb-28 sm:pb-36`}>
            <HeroResolve />
          </section>
        </div>

        {/* The before: calm opener before the repeated centred product panels. */}
        <Band>
          <Head align="center">
            Three weeks of reading, and one missed line voids it
          </Head>
          <p className="mx-auto mt-5 max-w-[58ch] text-center text-lg leading-relaxed text-ink-muted">
            A bid writer spends weeks reading a public-sector tender by hand. The
            requirements are scattered across a hundred pages, and the ones that
            disqualify you look just like the ones that do not.
          </p>
        </Band>

        <FeatureSection
          title={
            <>
              <span className="block sm:whitespace-nowrap">The one that loses </span>
              <span className="block sm:whitespace-nowrap">you the bid, first</span>
            </>
          }
          copy="Public tenders have hard pass or fail gates. Bidframe puts the deal-breakers at the top, not buried on page 61."
          panel={<DealBreakerCard />}
          size="poster-snug"
          tilt="right"
        />

        <FeatureSection
          title="Three steps, and you stay in control"
          copy="Upload the tender, review the worklist, then approve the answers. Nothing leaves the record without you."
          panel={
            <div className="surface-grain rounded-lg border border-hairline bg-paper-raised p-6 shadow-[var(--depth-sheet)] sm:p-7">
              <HowItWorks />
            </div>
          }
          tilt="left"
          maxWidth="max-w-[1040px]"
        />

        <FeatureSection
          title="Every line, back to its clause"
          copy="One click shows the exact sentence on the exact page, so you never have to take our word for it."
          panel={<ClauseCard />}
          surface="recessed"
          tilt="right"
        />

        <FeatureSection
          title="It tells you when it is not sure"
          copy="Where the tool is unsure, it says so and flags it for you to check. It does not guess."
          panel={<ConfidenceDocket />}
          surface="moss"
          tilt="left"
          maxWidth="max-w-[1040px]"
        />

        <FeatureSection
          title="Answers, with receipts"
          copy="Bidframe drafts from your own documents and shows which one each line came from. You approve every line."
          panel={<AnswerCard />}
          tilt="right"
        />

        {/* Before and after: a ruled ledger, full width, the table is the
            visual. The payoff column stands on moss behind a full-strength
            forest rule, so the ledger carries a visible verdict. */}
        <Band space="air">
          <Head align="center">
            Before, and with Bidframe
          </Head>
          <div className="mt-9 overflow-x-auto">
            <table className="comparison-table mx-auto w-full max-w-[980px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="w-[18%] border-b border-ink py-4 pr-6" />
                  <th className="w-[38%] border-b border-ink py-4 pr-6 text-base font-medium text-ink-muted">
                    Before
                  </th>
                  <th className="border-b border-ink py-4 pl-6 text-base font-semibold text-forest">
                    With Bidframe
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <Row key={row.label} {...row} />
                ))}
              </tbody>
            </table>
          </div>
        </Band>

        {/* Credibility: where the counts come from, in plain provisional terms.
            Sits just before the proof it explains. */}
        <Band space="tight">
          <CredibilityBand />
        </Band>

        {/* The forest threshold: the paper page descends through moss and two
            pine ridges before the proof band, so the dark proof ground feels
            earned rather than abrupt. */}
        <ForestThreshold />

        {/* Pine band 1: the proof is the page's ceremonial register. The seal,
            rules, low treeline and branch previews echo the footer before it
            arrives, so the close reads as a destination already promised. */}
        <section className="proof-band relative isolate overflow-hidden bg-pine text-paper">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <Seal
              id="seal-proof-watermark"
              className="absolute right-[7%] top-24 hidden h-64 w-64 rotate-[8deg] text-paper/[0.06] lg:block"
            />
            <TreelineDivider className="absolute inset-x-0 bottom-0 h-20 w-full text-pine-deep/35 sm:h-28" />
          </div>
          <DrawOn className="pointer-events-none absolute -right-10 top-14 hidden lg:block">
            <PineBranch className="h-56 w-auto rotate-[11deg] text-paper/[0.08]" />
          </DrawOn>
          <div className={`${CONTAINER} relative z-10 py-28 sm:py-36`}>
            <div className="grid gap-10 border-y border-paper/20 py-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
              <div className="max-w-[48ch]">
                <Head tone="dark" size="poster">
                  Measured on a real tender
                </Head>
                <p className="mt-5 text-lg leading-relaxed text-paper/70">
                  We ran Bidframe on a live public-sector cleaning contract and
                  checked every line against the source.
                </p>
              </div>
              <p className="max-w-[34ch] text-lg leading-relaxed text-paper/60 lg:justify-self-end lg:text-right">
                Source-checked against a public-sector cleaning contract and
                kept tied to the tender record.
              </p>
            </div>
            <Reveal className="mt-12 sm:mt-16">
              <ProofNumbers />
            </Reveal>
          </div>
        </section>
      </main>

      {/* Pine band 2: the closing. A lifted response card on the pine ground,
          carrying the one primary action: Book a demo. A cropped pine branch
          draws in at the top-left corner and the civic seal sits asymmetrically
          beside the card, so the destination belongs to the same forest the
          treeline promised. */}
      <section className="relative overflow-hidden border-t border-paper/10 bg-pine">
        <TreelineDivider
          flip
          className="absolute inset-x-0 top-0 h-16 w-full text-pine-deep/25 sm:h-24"
        />
        <DrawOn className="pointer-events-none absolute -left-12 -top-8">
          <PineBranch className="h-44 w-auto text-paper/[0.11]" />
        </DrawOn>
        <div className={`${CONTAINER} relative py-24 sm:py-32`}>
          <Seal
            id="seal-closing"
            className="absolute right-[6%] top-1/2 hidden h-52 w-52 -translate-y-1/2 rotate-[7deg] text-paper/25 lg:block"
          />
          <div className="surface-grain relative z-10 mx-auto max-w-[600px] rounded-lg border border-hairline bg-paper-raised p-8 text-center shadow-[var(--depth-sheet)] sm:p-10">
            <h2 className="mx-auto max-w-[20ch] text-balance font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              See it on a tender you already know
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] leading-relaxed text-ink-muted">
              The quickest way to judge Bidframe is to watch it read a tender you
              have already bid. Book fifteen minutes and bring one.
            </p>
            <div className="mt-7 flex justify-center">
              <BookDemoButton location="closing" />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ForestThreshold() {
  return (
    <section className="relative overflow-hidden border-t border-moss-line bg-moss">
      <div className={`${CONTAINER} relative z-10 py-12 sm:py-16`}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)] lg:items-end">
          <p className="max-w-[46ch] text-lg leading-relaxed text-ink-muted">
            The proof comes after the reading: hard gates, requirements, and
            source checks, held together in one record.
          </p>
          <div className="grid gap-2 sm:grid-cols-4">
            <TrailStep label="Gate found" detail="ISO 9001" />
            <TrailStep label="Clause traced" detail="4.2.1 / p.14" />
            <TrailStep label="Source checked" detail="answer key" />
            <TrailStep label="Answer approved" detail="14:32" />
          </div>
        </div>
      </div>
      <DrawOn className="pointer-events-none absolute -right-10 top-2 hidden sm:block">
        <PineBranch className="h-40 w-auto rotate-[8deg] text-forest/[0.14]" />
      </DrawOn>
      <TreelineDivider className="block h-16 w-full text-pine/55 sm:h-24" />
      <TreelineDivider
        flip
        className="-mt-12 -mb-px block h-20 w-full text-pine sm:-mt-16 sm:h-28"
      />
    </section>
  );
}

function TrailStep({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="border-l border-moss-line bg-paper/35 px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-forest">
        {label}
      </p>
      <p className="mt-1 text-sm text-ink-muted">{detail}</p>
    </div>
  );
}

// A paper section, left-aligned to the reading edge, separated by a section
// rule. Hierarchy from type and space, not boxes. `surface` opts one band onto
// the recessed ground or the green-tinged moss ground (the surface tones that
// sit between paper and the pine bands), each with the hairline that reads on
// it; `space` varies the vertical rhythm so related ideas cluster and the
// summarising bands get more air, instead of a uniform py on every band.
function Band({
  children,
  surface = "paper",
  space = "normal",
}: {
  children: React.ReactNode;
  surface?: "paper" | "recessed" | "moss";
  space?: "tight" | "normal" | "air";
}) {
  const pad =
    space === "tight"
      ? "py-12 sm:py-14"
      : space === "air"
        ? "py-20 sm:py-28"
        : "py-16 sm:py-20";
  const ground =
    surface === "recessed"
      ? "border-rule-section bg-paper-recessed"
      : surface === "moss"
        ? "border-moss-line bg-moss"
        : "border-rule-section";
  return (
    <section className={`border-t ${ground}`}>
      <div className={`${CONTAINER} ${pad}`}>{children}</div>
    </section>
  );
}

function FeatureSection({
  title,
  copy,
  panel,
  surface = "paper",
  tilt,
  size,
  maxWidth = "max-w-[920px]",
}: {
  title: React.ReactNode;
  copy: string;
  panel: React.ReactNode;
  surface?: "paper" | "recessed" | "moss";
  tilt: "left" | "right";
  size?: "poster-snug";
  maxWidth?: string;
}) {
  return (
    <Band surface={surface} space="air">
      <div className="mx-auto max-w-[760px] text-center">
        <Head align="center" size={size}>
          {title}
        </Head>
        <p className="mx-auto mt-5 max-w-[58ch] text-lg leading-relaxed text-ink-muted sm:text-xl">
          {copy}
        </p>
      </div>
      <PanelFrame tilt={tilt} className={`mx-auto mt-12 ${maxWidth}`}>
        {panel}
      </PanelFrame>
    </Band>
  );
}

function PanelFrame({
  children,
  tilt,
  className = "",
}: {
  children: React.ReactNode;
  tilt: "left" | "right";
  className?: string;
}) {
  return (
    <div className={`section-panel section-panel-${tilt} ${className}`}>
      {children}
    </div>
  );
}

function ConfidenceDocket() {
  return (
    <div className="card-live surface-grain w-full overflow-hidden rounded-lg border border-moss-line bg-paper-raised shadow-[var(--depth-sheet)]">
      <div className="flex items-center justify-between border-b border-hairline bg-paper px-5 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Risk register
        </span>
        <span className="font-mono text-[11px] text-ink-muted">draft evidence</span>
      </div>
      <div className="divide-y divide-hairline">
        <ConfidenceStampRow
          confidence={0.3}
          unanswerable
          label="Can't answer this"
          example="No source found for this"
        />
        <ConfidenceStampRow
          confidence={0.5}
          label="Low confidence"
          example="The clause is ambiguous"
        />
        <ConfidenceStampRow
          confidence={0.7}
          label="Fairly sure"
          example="Likely, but check the date"
        />
        <ConfidenceStampRow
          confidence={0.92}
          label="Confident"
          example="Matches the clause exactly"
        />
      </div>
      <div className="border-t border-hairline bg-paper px-5 py-3">
        <p className="font-mono text-[11px] leading-relaxed text-ink-muted">
          Nothing enters the answer unchecked when the source is weak.
        </p>
      </div>
    </div>
  );
}

// One confidence stamp paired with a short plain example, so the four-tier scale
// teaches what each level means rather than only decorating. The example sits in
// the mono record voice and stays greyscale-safe (no colour, no percentage).
function ConfidenceStampRow({
  confidence,
  unanswerable = false,
  label,
  example,
}: {
  confidence: number;
  unanswerable?: boolean;
  label: string;
  example: string;
}) {
  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[176px_1fr] sm:items-center sm:gap-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <ConfidenceIndicator
          confidence={confidence}
          unanswerable={unanswerable}
          variant="dot"
        />
        <span className="text-sm font-medium text-ink">{label}</span>
      </div>
      <span className="border-l border-hairline pl-3 font-mono text-xs leading-relaxed text-ink-muted">
        {example}
      </span>
    </div>
  );
}

// A section head. `size="poster"` steps the head up to poster scale, reserved
// for the deal-breaker band and the proof band, the two moments the page raises
// its voice.
function Head({
  children,
  tone = "light",
  size,
  align = "left",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  // "poster" is the full poster scale (the proof band); "poster-snug" steps the
  // top end down one notch so a two-line head holds two lines inside a split
  // column instead of breaking to three.
  size?: "poster" | "poster-snug";
  align?: "left" | "center";
}) {
  const scale =
    size === "poster"
      ? "text-balance text-4xl leading-[1.02] sm:text-6xl md:text-7xl"
      : size === "poster-snug"
        ? "text-balance text-4xl leading-[1.05] sm:text-5xl md:text-6xl"
        : "text-balance text-3xl leading-tight sm:text-4xl";
  const centred = align === "center";
  return (
    <h2
      className={`max-w-[20ch] font-serif font-semibold tracking-tight ${scale} ${
        tone === "dark" ? "text-paper" : "text-ink"
      } ${centred ? "mx-auto text-center" : ""}`}
    >
      {children}
    </h2>
  );
}

function Row({
  label,
  before,
  after,
}: {
  label: string;
  before: string;
  after: string;
}) {
  return (
    <tr className="border-b border-hairline align-top last:border-b-0">
      <th
        scope="row"
        className="py-5 pr-6 text-left text-base font-medium text-ink"
      >
        {label}
      </th>
      <td
        data-label="Before"
        className="py-5 pr-6 text-lg leading-relaxed text-ink-muted"
      >
        {/* An empty before-cell still reads as a ledger entry, not a gap. */}
        {before || <span aria-hidden>—</span>}
      </td>
      <td
        data-label="With Bidframe"
        className="py-5 pl-6 text-lg leading-relaxed text-ink"
      >
        <span className="inline-flex items-start gap-3">
          {/* The forest tick from the matrix status word: the verdict column
              carries its mark, not colour alone. */}
          <span className="mt-[0.35em] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-forest/35 bg-moss text-forest">
            <svg
              width="11"
              height="11"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 7.5l3 3 6-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {after}
        </span>
      </td>
    </tr>
  );
}
