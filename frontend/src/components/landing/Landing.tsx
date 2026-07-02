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
// (a fern off the right, a pine branch off the left), each band opens with a
// small mono eyebrow so the argument reads as a numbered case, the honesty
// band rests on the moss surface, and a treeline seam drops the page onto two
// pine grounds: the proof band and the closing, where the civic seal sits
// beside the response card. The deal-breaker head is the one poster-scale
// moment before the giant proof figures.
//
// Layout follows layout.md and SLOP-CHECK: the content-bearing bands run a real
// two-column split (prose one side, the section's card the other) and alternate
// which side the visual sits on from band to band, so the page has rhythm and no
// dead right column. On mobile everything stacks in source order (text before
// visual). Hierarchy comes from type, space, and three rule weights, not boxes.
// The hero and the closing are the two deliberate centred focal moments; the
// giant proof numbers are the climax, held back to just before the closing CTA.

const CONTAINER = "mx-auto w-full max-w-[1160px] px-6";

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
        {/* The hero fold: headline, supporting line and product sheet stand on
            their own fading graph paper, with the two large engravings cropped
            by the page edge so the forest walks into the document rather than
            decorating it. The art layer paints above the grid but beneath the
            z-10 content, and the clip stops the bleed causing sideways scroll. */}
        <div className="paper-grid-hero relative overflow-x-clip">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <FernFrond className="art-draw absolute -right-16 top-24 hidden h-[440px] w-auto rotate-[8deg] text-forest/[0.16] lg:block" />
            <PineBranch className="art-draw absolute -left-10 bottom-6 hidden h-40 w-auto text-forest/[0.12] lg:block" />
          </div>

          {/* Hero: a centred two-line headline, a single supporting line, then
              the product sheet. The one symmetric moment, earned. */}
          <section className={`${CONTAINER} relative z-10 pt-16 pb-10 text-center sm:pt-24 sm:pb-14`}>
            <h1 className="hero-enter font-serif font-semibold tracking-tight text-ink">
              <span className="block text-balance text-5xl leading-[1.02] sm:whitespace-nowrap sm:text-6xl md:text-7xl">
                Never lose a bid
              </span>
              <span className="mt-3 block text-balance text-2xl font-medium leading-[1.12] sm:whitespace-nowrap sm:text-3xl md:text-4xl">
                to a deal-breaker you missed.
              </span>
            </h1>
            <p className="hero-enter-2 mx-auto mt-6 max-w-[58ch] text-balance text-lg leading-relaxed text-ink-muted sm:text-xl">
              Bidframe reads a public-sector tender, finds every requirement, and
              flags the ones that would disqualify you. Each links back to the exact
              clause, so you can check it yourself.
            </p>
            <div className="hero-enter-3 mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
              <BookDemoButton location="hero" size="lg" />
              <SeeItRunLink size="lg" />
            </div>
            <p className="hero-enter-3 mx-auto mt-5 font-mono text-xs text-ink-muted">
              Fifteen minutes. Bring a tender you have already bid.
            </p>
          </section>

          <section className={`${CONTAINER} relative z-10 pb-20`}>
            <HeroResolve />
          </section>
        </div>

        {/* The before: calm, left-aligned, low weight. A quiet single-column
            opener, no visual, so the two-column bands below land with rhythm. */}
        <Band>
          <Head eyebrow="The cost">
            Three weeks of reading, and one missed line voids it
          </Head>
          <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-ink-muted">
            A bid writer spends weeks reading a public-sector tender by hand. The
            requirements are scattered across a hundred pages, and the ones that
            disqualify you look just like the ones that do not.
          </p>
        </Band>

        {/* The catch: the hero feature, given weight. Text left, the oxblood
            deal-breaker lifted off the page on the right. The point of tension. */}
        <SplitBand visual={<DealBreakerCard />}>
          <Head eyebrow="The catch" size="poster">
            The one that loses you the bid, first
          </Head>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            Public tenders have hard pass or fail gates. Bidframe puts the
            deal-breakers at the top, not buried on page 61, so you see the
            bid-killer before you read anything else.
          </p>
        </SplitBand>

        {/* How it works: three numbered steps joined by a ruled through-line. Full
            width, its own three columns, so it reads as a ledger row. */}
        <Band>
          <Head eyebrow="The method">Three steps, and you stay in control</Head>
          <div className="mt-9">
            <HowItWorks />
          </div>
        </Band>

        {/* Trust: the ruled margin and a pressed evidence block. Card left, prose
            right, so the visual flips side from the band above. */}
        <SplitBand visual={<ClauseCard />} reverse surface="recessed">
          <Head eyebrow="Traceability">Every line, back to its clause</Head>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            We pulled these from the tender. One click shows the exact sentence on
            the exact page, so you never take our word for it.
          </p>
        </SplitBand>

        {/* Honesty: the four-tier confidence scale as dimensional beads on the
            moss ground, the one band that rests on the landing's third surface.
            Text left, the scale on the right. */}
        <SplitBand
          surface="moss"
          visual={
            <div className="card-live surface-grain w-full rounded-lg border border-moss-line bg-paper-raised p-7 shadow-[var(--depth-row)]">
              <div className="flex flex-col gap-4">
                <ConfidenceBead
                  confidence={0.3}
                  unanswerable
                  example="No source found for this"
                />
                <ConfidenceBead confidence={0.5} example="The clause is ambiguous" />
                <ConfidenceBead
                  confidence={0.7}
                  example="Likely, but check the date"
                />
                <ConfidenceBead
                  confidence={0.92}
                  example="Matches a clause word for word"
                />
              </div>
            </div>
          }
          visualWidth="lg:w-[360px]"
        >
          <Head eyebrow="Honesty">It tells you when it is not sure</Head>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            Where the tool is unsure, it says so and flags it for you to check. It
            does not guess, and it does not dress a rough draft up as a finished
            one.
          </p>
        </SplitBand>

        {/* Answers, with receipts: the autofill payoff and the approval stamp.
            Card left, prose right, flipping side again. */}
        <SplitBand visual={<AnswerCard />} reverse>
          <Head eyebrow="Receipts">Answers, with receipts</Head>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            Bidframe drafts each answer from your own documents and shows which one
            it came from. You approve every line before it goes in the bid.
          </p>
        </SplitBand>

        {/* Before and after: a ruled ledger, full width, the table is the
            visual. The payoff column stands on moss behind a full-strength
            forest rule, so the ledger carries a visible verdict. */}
        <Band space="air">
          <Head eyebrow="The ledger">Before, and with Bidframe</Head>
          <Reveal className="mt-7 overflow-x-auto">
            <table className="w-full max-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink">
                  <th className="w-[24%] py-3 pr-6" />
                  <th className="py-3 pr-6 font-serif text-base font-medium text-ink-muted">
                    Before
                  </th>
                  <th className="border-l-2 border-forest bg-moss py-3 pl-6 font-serif text-base font-medium text-forest">
                    With Bidframe
                  </th>
                </tr>
              </thead>
              <tbody>
                <Row label="Time" before="Weeks of expert reading" after="Minutes" />
                <Row
                  label="The deal-breaker"
                  before="A missed gate voids the whole bid"
                  after="Caught and shown first"
                />
                <Row
                  label="Trust"
                  before="You hope the checklist is complete"
                  after="Every requirement links to its clause"
                />
                <Row
                  label="Uncertainty"
                  before="Invisible"
                  after="Flagged for you to check"
                />
                <Row
                  label="Your response"
                  before="A blank page"
                  after="Drafted from your own documents"
                />
                <Row
                  label="Control"
                  before=""
                  after="You approve, edit, or flag every line"
                />
              </tbody>
            </table>
          </Reveal>
        </Band>

        {/* Credibility: where the counts come from, in plain provisional terms.
            Sits just before the proof it explains. */}
        <Band space="tight">
          <CredibilityBand />
        </Band>

        {/* The treeline seam: the page drops off the paper onto the pine
            grounds here, so the proof reads as arriving somewhere rather than
            the lights simply going out. The -mb-px overlap stops a hairline of
            paper showing between the ridge and the band below it. */}
        <TreelineDivider className="-mb-px block h-12 w-full text-pine sm:h-20" />

        {/* Pine band 1: the proof, as giant mono figures reversed out on the
            brand's own dark. Held back to here so the page builds toward it as
            the climax before the closing action. */}
        <section className="bg-pine">
          <div className={`${CONTAINER} py-24 sm:py-32`}>
            <div className="max-w-[48ch]">
              <Head tone="dark" eyebrow="The proof" size="poster">
                Measured on a real tender
              </Head>
              <p className="mt-5 text-lg leading-relaxed text-paper/70">
                We ran Bidframe on a live public-sector cleaning contract and
                checked every line against the source.
              </p>
            </div>
            <Reveal className="mt-12">
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
        <DrawOn className="pointer-events-none absolute -left-12 -top-8">
          <PineBranch className="h-44 w-auto text-paper/10" />
        </DrawOn>
        <div className={`${CONTAINER} relative py-24 sm:py-32`}>
          <Seal
            id="seal-closing"
            className="absolute right-[6%] top-1/2 hidden h-52 w-52 -translate-y-1/2 rotate-[7deg] text-paper/25 lg:block"
          />
          <div className="surface-grain relative z-10 mx-auto max-w-[600px] rounded-2xl border border-hairline bg-paper-raised p-8 text-center shadow-[var(--depth-sheet)] sm:p-10">
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

// One confidence bead paired with a short plain example, so the four-tier scale
// teaches what each level means rather than only decorating. The example sits in
// the mono record voice and stays greyscale-safe (no colour, no percentage).
function ConfidenceBead({
  confidence,
  unanswerable = false,
  example,
}: {
  confidence: number;
  unanswerable?: boolean;
  example: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <ConfidenceIndicator
        confidence={confidence}
        unanswerable={unanswerable}
        variant="word"
      />
      <span className="pl-[30px] font-mono text-xs text-ink-muted">
        {example}
      </span>
    </div>
  );
}

// A content-bearing band with a real two-column split: prose on one side, the
// section's card on the other. `reverse` flips which side the card sits on from
// band to band so the page has rhythm; the DOM keeps prose first so that on
// mobile everything stacks in source order (text before visual).
function SplitBand({
  children,
  visual,
  reverse = false,
  visualWidth = "lg:w-[440px]",
  surface = "paper",
}: {
  children: React.ReactNode;
  visual: React.ReactNode;
  reverse?: boolean;
  visualWidth?: string;
  surface?: "paper" | "recessed" | "moss";
}) {
  return (
    <Band surface={surface}>
      <div
        className={`grid gap-8 lg:items-center lg:gap-16 ${
          reverse ? "lg:grid-cols-[auto_1fr]" : "lg:grid-cols-[1fr_auto]"
        }`}
      >
        <div className={`max-w-[46ch] ${reverse ? "lg:order-2" : ""}`}>
          {children}
        </div>
        <div className={`w-full ${visualWidth} ${reverse ? "lg:order-1" : ""}`}>
          {visual}
        </div>
      </div>
    </Band>
  );
}

// A section head with an optional mono eyebrow, so each band opens like an
// entry in a case file rather than a bare title. The eyebrow renders as a
// sibling above the h2 (heading semantics stay on the h2 alone), forest on
// paper and moss on the dark grounds. `size="poster"` steps the head up to
// poster scale, reserved for the deal-breaker band and the proof band, the
// two moments the page raises its voice.
function Head({
  children,
  tone = "light",
  eyebrow,
  size,
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  eyebrow?: string;
  size?: "poster";
}) {
  const scale =
    size === "poster"
      ? "text-balance text-4xl leading-[1.02] sm:text-6xl md:text-7xl"
      : "text-balance text-3xl leading-tight sm:text-4xl";
  return (
    <>
      {eyebrow && (
        <p
          className={`mb-3 font-mono text-[11px] uppercase tracking-[0.22em] ${
            tone === "dark" ? "text-moss" : "text-forest"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`max-w-[20ch] font-serif font-semibold tracking-tight ${scale} ${
          tone === "dark" ? "text-paper" : "text-ink"
        }`}
      >
        {children}
      </h2>
    </>
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
    <tr className="border-b border-hairline align-top transition-colors hover:bg-paper-raised">
      <th
        scope="row"
        className="py-3 pr-6 text-left font-mono text-xs font-normal uppercase tracking-wide text-ink-muted"
      >
        {label}
      </th>
      <td className="py-3 pr-6 text-ink-muted">{before}</td>
      <td className="border-l-2 border-forest bg-moss py-3 pl-6 text-ink">
        {after}
      </td>
    </tr>
  );
}
