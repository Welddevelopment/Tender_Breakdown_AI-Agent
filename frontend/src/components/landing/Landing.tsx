import Link from "next/link";
import { BookDemoButton, SeeItRunLink } from "./BookDemoButton";
import { ClosingArrival } from "./ClosingArrival";
import { ForestHeroLayers } from "./ForestHeroLayers";
import { HeroResolve } from "./HeroResolve";
import { Reveal } from "./Reveal";
import { DrawOn } from "./DrawOn";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { BrandLogo } from "@/components/BrandLogo";
import {
  DealBreakerCard,
  ClauseCard,
  AnswerCard,
  ProductGalleryFrame,
} from "./ProductShots";
import { ProofScrolly } from "./ProofScrolly";
import { TrailDescent } from "./TrailDescent";
import { CredibilityBand } from "./CredibilityBand";
import { HowItWorks } from "./HowItWorks";
import { SiteFooter } from "./SiteFooter";
import { PineBranch } from "./art/PineBranch";
import { PressedLeaf } from "./art/PressedLeaf";
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

const CONTAINER = "mx-auto w-full max-w-[1160px] px-4 sm:px-6";

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
      <header className="landing-masthead sticky border-b-2 border-ink bg-paper/90 backdrop-blur-sm">
        <div className={`${CONTAINER} flex items-center justify-between py-3`}>
          <BrandLogo className="h-6 w-auto max-w-[8.25rem] sm:h-7 sm:max-w-none" />
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <Link
              href="/demo"
              className="link-draw hidden rounded-sm text-sm text-ink-muted transition-colors hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:inline"
            >
              See the demo
            </Link>
            <Link
              href="/login"
              className="link-draw hidden rounded-sm text-sm text-ink-muted transition-colors hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:inline"
            >
              Sign in
            </Link>
            <BookDemoButton location="masthead" className="shrink-0" />
          </div>
        </div>
      </header>

      <main>
        {/* The hero fold: a forest-tinted record backdrop, with the real product
            demo kept as the foreground sheet below the headline. */}
        <div className="forest-hero relative overflow-hidden">
          <ForestHeroLayers />

          {/* Hero: a centred two-line headline, a single supporting line, then
              the product sheet. The one symmetric moment, earned. */}
          <section className={`${CONTAINER} relative z-10 pt-12 pb-4 text-center sm:pt-[4.5rem] sm:pb-6 lg:pt-20`}>
            <h1 className="hero-enter forest-hero-title text-ink">
              <span className="forest-hero-title__headline block text-balance">
                Never lose a bid
              </span>
              <span className="forest-hero-title__subline block text-balance">
                to a <span className="hero-dealbreaker">deal-breaker</span> you
                missed.
              </span>
            </h1>
            <p className="hero-enter-2 forest-hero-lede mx-auto mt-5 max-w-[58ch] text-balance text-lg leading-relaxed text-ink-muted sm:text-xl">
              Bidframe reads the tender, catches disqualifying requirements, and
              links every flag to its exact clause.
            </p>
            <div className="hero-enter-3 mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
              <BookDemoButton location="hero" size="lg" />
              <SeeItRunLink size="lg" />
            </div>
          </section>

          <section className={`${CONTAINER} relative z-10 -mt-4 pb-28 sm:-mt-8 sm:pb-36`}>
            <div className="forest-hero-plinth">
              <HeroResolve />
            </div>
          </section>
        </div>

        {/* The trail: the five feature bands and the ledger walk down one
            engraved gutter path with waypoint blazes, while an ambient dusk
            deepens with scroll (TrailDescent — decorative, desktop-only). */}
        <TrailDescent>
        <FeatureSection
          title={
            <>
              <span className="block sm:whitespace-nowrap">The one that loses </span>
              <span className="block sm:whitespace-nowrap">you the bid, first</span>
            </>
          }
          copy="Public tenders have hard pass or fail gates. Bidframe puts the deal-breakers at the top, not buried on page 61."
          panel={
            <ProductGalleryFrame label="Priority register" tone="alert">
              <DealBreakerCard />
            </ProductGalleryFrame>
          }
          size="poster-snug"
          tilt="right"
        />

        <FeatureSection
          title="Three steps, and you stay in control"
          copy="Upload the tender, review the worklist, then approve the answers. Nothing leaves the record without you."
          panel={
            <ProductGalleryFrame label="Method register">
              <div className="landing-product-card surface-grain rounded-lg border border-hairline bg-paper-raised p-4 shadow-[var(--depth-sheet)] sm:p-5 lg:p-7">
                <HowItWorks />
              </div>
            </ProductGalleryFrame>
          }
          tilt="left"
          maxWidth="max-w-[1040px]"
        />

        <FeatureSection
          title="Every line, back to its clause"
          copy="One click shows the exact sentence on the exact page, so you never have to take our word for it."
          panel={
            <ProductGalleryFrame label="Source trace" tone="source">
              <ClauseCard />
            </ProductGalleryFrame>
          }
          surface="recessed"
          tilt="right"
        />

        <FeatureSection
          title="It tells you when it is not sure"
          copy="Where the tool is unsure, it says so and flags it for you to check. It does not guess."
          panel={
            <ProductGalleryFrame label="Evidence check" tone="source">
              <ConfidenceDocket />
            </ProductGalleryFrame>
          }
          surface="moss"
          tilt="left"
          maxWidth="max-w-[860px]"
        />

        <FeatureSection
          title="Answers, with receipts"
          copy="Bidframe drafts from your own documents and shows which one each line came from. You approve every line."
          panel={
            <ProductGalleryFrame label="Answer workspace" tone="answer">
              <AnswerCard />
            </ProductGalleryFrame>
          }
          tilt="right"
        />

        {/* Before and after: a ruled ledger, full width, the table is the
            visual. The payoff column stands on moss behind a full-strength
            forest rule, so the ledger carries a visible verdict. */}
        <Band space="air" className="comparison-band">
          <div className="comparison-shell mx-auto max-w-[1120px]">
            <div className="comparison-shell__head text-center">
              <Head align="center">Before, and with Bidframe</Head>
              <p className="mx-auto mt-4 max-w-[54ch] text-lg leading-relaxed text-ink-muted">
                The same tender record, before and after the gates, sources, and
                answer trail are made visible.
              </p>
            </div>
            <div className="comparison-table-wrap">
              <div className="overflow-x-auto">
                <table className="comparison-table w-full border-collapse text-left">
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
            </div>
          </div>
        </Band>

        {/* Credibility: where the counts come from, in plain provisional terms.
            Sits just before the proof it explains. */}
        <Band space="tight" className="credibility-band">
          <CredibilityBand />
        </Band>
        </TrailDescent>

        {/* The forest threshold: the paper page descends through moss and two
            pine ridges before the proof band, so the dark proof ground feels
            earned rather than abrupt. */}
        <ForestThreshold />

        {/* Pine band 1: the proof is the page's ceremonial register. The seal,
            rules, low treeline and branch previews echo the footer before it
            arrives, so the close reads as a destination already promised. */}
        {/* overflow-x-clip, not overflow-hidden: ProofScrolly pins a sticky
            stage inside this section, and overflow-hidden would kill it. */}
        <section className="proof-band relative isolate overflow-x-clip bg-pine text-paper">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="proof-band__image absolute inset-0" />
            <span className="proof-band__leaf-shadow absolute inset-0" />
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
            <ProofScrolly />
          </div>
        </section>
      </main>

      {/* Pine band 2: the closing as an arrival — the clearing the treeline
          promised. Silhouettes part, light blooms, and the response card rises
          into it (ClosingArrival). */}
      <ClosingArrival />

      <SiteFooter />
    </div>
  );
}

function ForestThreshold() {
  return (
    <section
      aria-hidden="true"
      className="forest-threshold forest-threshold--compact relative overflow-hidden border-t border-moss-line bg-moss"
    >
      <span aria-hidden className="forest-threshold__image absolute inset-0" />
      <TreelineDivider className="relative z-10 block h-14 w-full text-pine/55 sm:h-20" />
      <span aria-hidden className="forest-threshold__mist z-10" />
      <TreelineDivider
        flip
        className="relative z-10 -mt-10 -mb-px block h-[4.5rem] w-full text-pine sm:-mt-14 sm:h-24"
      />
    </section>
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
  className = "",
}: {
  children: React.ReactNode;
  surface?: "paper" | "recessed" | "moss";
  space?: "tight" | "normal" | "air";
  className?: string;
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
    <section className={`border-t ${ground} ${className}`}>
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
        <DrawOn className="mx-auto mb-5 flex h-10 w-10 items-center justify-center text-forest/35">
          <PressedLeaf
            variant={tilt === "left" ? "fern" : "oak"}
            className="h-10 w-10"
          />
        </DrawOn>
        <Head align="center" size={size}>
          {title}
        </Head>
        <p className="mx-auto mt-5 max-w-[58ch] text-lg leading-relaxed text-ink-muted sm:text-xl">
          {copy}
        </p>
      </div>
      <Reveal className={`mx-auto mt-12 ${maxWidth}`}>
        <PanelFrame tilt={tilt}>{panel}</PanelFrame>
      </Reveal>
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
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-hairline bg-paper px-4 py-3.5 sm:px-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          Evidence check
        </span>
        <span className="font-mono text-[11px] text-ink-muted">source status</span>
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
      <div className="border-t border-hairline bg-paper/70 px-4 py-3 sm:px-5">
        <p className="max-w-[38ch] font-mono text-[11px] leading-relaxed text-ink-muted">
          Weak sources stay visible until a human clears them.
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
    <div className="grid min-w-0 gap-3 px-4 py-4 transition-colors hover:bg-paper/55 sm:grid-cols-[182px_1fr] sm:items-center sm:gap-5 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <ConfidenceIndicator
          confidence={confidence}
          unanswerable={unanswerable}
          variant="dot"
        />
        <span className="text-sm font-medium leading-snug text-ink">{label}</span>
      </div>
      <span className="border-t border-hairline pt-2 font-mono text-xs leading-relaxed text-ink-muted sm:border-l sm:border-t-0 sm:pt-0 sm:pl-4">
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
  singleLine = false,
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  // "poster" is the full poster scale (the proof band); "poster-snug" steps the
  // top end down one notch so a two-line head holds two lines inside a split
  // column instead of breaking to three.
  size?: "poster" | "poster-snug";
  align?: "left" | "center";
  singleLine?: boolean;
}) {
  const scale =
    size === "poster"
      ? "text-balance text-4xl leading-[1.02] sm:text-6xl md:text-7xl"
      : size === "poster-snug"
        ? "text-balance text-4xl leading-[1.05] sm:text-5xl md:text-6xl"
        : "text-balance text-3xl leading-tight sm:text-4xl";
  const centred = align === "center";
  const width = singleLine ? "max-w-none lg:whitespace-nowrap" : "max-w-[20ch]";
  return (
    <h2
      className={`${width} font-serif font-semibold tracking-tight ${scale} ${
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
