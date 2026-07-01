import Link from "next/link";
import { BookDemoButton, SeeItRunLink } from "./BookDemoButton";
import { HeroResolve } from "./HeroResolve";
import { ApprovalStamp } from "@/components/ApprovalStamp";
import { BotanicalSprig } from "./BotanicalSprig";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { BrandLogo } from "@/components/BrandLogo";

// The public landing page (landing-page-brief). It is itself a civic record: the
// same paper, masthead, rules, mono record voice, and real product components as
// the app, so the medium makes the credibility argument before a word is read.
// One job: get a bid writer to book a demo.
//
// Layout follows layout.md and SLOP-CHECK: the body is left-aligned to the
// reading edge, hierarchy comes from type, space, and three rule weights (not
// boxes), and the layout carries the stakes (the deal-breaker catch is heavy and
// lifted, the calm explanatory copy is light). No eyebrow kickers, no uniform
// card grids, one 2px ink rule (the masthead). The hero and the closing are the
// two deliberate centred focal moments; everything between is left-aligned.

const CONTAINER = "mx-auto w-full max-w-[1160px] px-6";

export function Landing() {
  return (
    <div className="bg-paper paper-grid">
      {/* Masthead: a slim warm letterhead carrying the one 2px ink rule and the
          prominent forest CTA. */}
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/85 backdrop-blur-sm">
        <div className={`${CONTAINER} flex items-center justify-between py-3`}>
          <BrandLogo className="h-7 w-auto" />
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="rounded-sm text-sm text-ink-muted underline decoration-hairline decoration-1 underline-offset-4 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Sign in
            </Link>
            <BookDemoButton location="masthead" />
          </div>
        </div>
      </header>

      <main>
        {/* Hero: a centred two-line headline, a single supporting line, then the
            tilted product sheet. The one symmetric moment, earned. */}
        <section className={`${CONTAINER} relative pt-16 pb-10 text-center sm:pt-24 sm:pb-14`}>
          <BotanicalSprig className="pointer-events-none absolute left-1 top-10 hidden h-16 w-16 text-forest/25 sm:block" />
          <BotanicalSprig className="pointer-events-none absolute right-1 top-10 hidden h-16 w-16 -scale-x-100 text-forest/25 sm:block" />
          <h1 className="hero-enter font-serif font-semibold tracking-tight text-ink">
            <span className="block text-5xl leading-[1.02] sm:whitespace-nowrap sm:text-6xl md:text-7xl">
              Never lose a bid
            </span>
            <span className="mt-3 block text-2xl font-medium leading-[1.12] sm:whitespace-nowrap sm:text-3xl md:text-4xl">
              to a deal-breaker you missed.
            </span>
          </h1>
          <p className="hero-enter-2 mx-auto mt-6 text-lg leading-relaxed text-ink-muted sm:text-xl">
            Bidframe reads a public-sector tender and flags what would disqualify you.
          </p>
          <div className="hero-enter-3 mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <BookDemoButton location="hero" size="lg" />
            <SeeItRunLink size="lg" />
          </div>
        </section>

        <section className={`${CONTAINER} relative pb-20`}>
          <BotanicalSprig className="pointer-events-none absolute -left-2 top-0 z-10 hidden h-16 w-16 text-forest/55 sm:block" />
          <BotanicalSprig className="pointer-events-none absolute -right-2 bottom-24 z-10 hidden h-16 w-16 rotate-180 text-forest/55 sm:block" />
          <HeroResolve />
        </section>

        {/* The before: calm, left-aligned, low weight. */}
        <Band>
          <Head>Three weeks of reading, and one missed line voids it</Head>
          <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-ink-muted">
            A bid writer spends weeks reading a public-sector tender by hand. The
            requirements are scattered across a hundred pages, and the ones that
            disqualify you look just like the ones that do not.
          </p>
        </Band>

        {/* The catch: the hero feature, given weight. An asymmetric split, the
            oxblood deal-breaker lifted off the page. This is the deliberate
            point of tension. */}
        <Band>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
            <div className="max-w-[42ch]">
              <Head>The one that loses you the bid, first</Head>
              <p className="mt-5 text-lg leading-relaxed text-ink-muted">
                Public tenders have hard pass or fail gates. Bidframe puts the
                deal-breakers at the top, not buried on page 61, so you see the
                bid-killer before you read anything else.
              </p>
            </div>
            <div className="surface-grain w-full rounded-lg border border-hairline bg-paper-raised p-5 shadow-[var(--depth-sheet)] lg:w-[400px]">
              <div className="border-l-2 border-signal-oxblood pl-4">
                <p className="font-mono text-xs font-medium uppercase tracking-wide text-signal-oxblood">
                  Deal-breaker
                </p>
                <p className="mt-1.5 leading-snug text-ink">
                  The supplier must hold ISO 9001 certification for the full
                  contract term. Miss it and the bid is rejected.
                </p>
                <p className="mt-3 font-mono text-xs text-ink-muted">
                  p.14 · Section 4.2.1
                </p>
              </div>
            </div>
          </div>
        </Band>

        {/* Ink band 1: the proof, as a left-aligned ruled ledger, not stat
            tiles. The mono figures reversed out on ink read as an official
            statement. */}
        <section className="bg-ink">
          <div className={`${CONTAINER} py-20 sm:py-24`}>
            <div className="max-w-[48ch]">
              <Head tone="dark">Measured on a real tender</Head>
              <p className="mt-5 text-lg leading-relaxed text-paper/70">
                We ran Bidframe on a live public-sector cleaning contract and
                checked every line against the source.
              </p>
            </div>
            <dl className="mt-12 border-t border-paper/15">
              <ProofRow figure="Every" label="deal-breaker caught" />
              <ProofRow
                figure="18 / 19"
                label="requirements found, the last one flagged for you"
              />
              <ProofRow
                figure="0"
                label="answers invented, every claim links to your document"
              />
            </dl>
          </div>
        </section>

        {/* How it works: three numbered steps, whitespace-separated (peers), not
            a card grid. */}
        <Band>
          <Head>Three steps, and you stay in control</Head>
          <ol className="mt-9 space-y-8">
            <Step
              n="1"
              title="Upload the tender"
              body="Drop in the PDF. Bidframe reads it and finds every requirement, with its source."
            />
            <Step
              n="2"
              title="Review the worklist"
              body="Each requirement comes with its confidence and its clause reference. The deal-breakers and the uncertain ones are flagged. You approve, edit, or flag each one."
            />
            <Step
              n="3"
              title="Draft your answers"
              body="Bidframe drafts each answer from your own documents and shows where it came from. It asks you only what it cannot find."
            />
          </ol>
        </Band>

        {/* Trust: the ruled margin and a pressed evidence block. */}
        <Band>
          <Head>Every line, back to its clause</Head>
          <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-ink-muted">
            We pulled these from the tender. One click shows the exact sentence on
            the exact page, so you never take our word for it.
          </p>
          <div className="surface-grain mt-8 max-w-[560px] rounded-lg border border-hairline bg-paper-raised p-5 shadow-[var(--depth-row)]">
            <div className="grid grid-cols-[52px_1fr] gap-x-4">
              <div className="border-r border-hairline pr-3 text-right font-mono text-xs leading-relaxed text-ink-muted">
                4.2.1
                <br />
                p.14
              </div>
              <div>
                <p className="leading-snug text-ink">
                  The supplier must hold ISO 9001 certification.
                </p>
                <div className="mt-3 rounded-md bg-paper-recessed p-3 shadow-[var(--depth-pressed)]">
                  <p className="border-l-2 border-forest pl-3 font-mono text-xs leading-relaxed text-ink-muted">
                    &ldquo;Tenderers shall hold and maintain certification to ISO
                    9001 for the duration of the contract.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Band>

        {/* Honesty: the four-tier confidence scale as dimensional beads. */}
        <Band>
          <Head>It tells you when it is not sure</Head>
          <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-ink-muted">
            Where the tool is unsure, it says so and flags it for you to check. It
            does not guess, and it does not dress a rough draft up as a finished
            one.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-9 gap-y-4">
            <ConfidenceIndicator confidence={0.3} unanswerable variant="word" />
            <ConfidenceIndicator confidence={0.5} variant="word" />
            <ConfidenceIndicator confidence={0.7} variant="word" />
            <ConfidenceIndicator confidence={0.92} variant="word" />
          </div>
        </Band>

        {/* Answers, with receipts: the autofill payoff and the approval stamp. */}
        <Band>
          <Head>Answers, with receipts</Head>
          <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-ink-muted">
            Bidframe drafts each answer from your own documents and shows which one
            it came from. You approve every line before it goes in the bid.
          </p>
          <div className="surface-grain mt-8 max-w-[560px] rounded-lg border border-hairline bg-paper-raised p-5 shadow-[var(--depth-row)]">
            <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
              Requirement
            </p>
            <p className="mt-1 leading-snug text-ink">
              The supplier must hold ISO 9001 certification.
            </p>
            <div className="mt-4 rounded-md border-l-2 border-forest bg-paper p-3">
              <p className="leading-relaxed text-ink">
                We hold ISO 9001:2015, certified by a UKAS-accredited body, valid
                for the full contract term.
              </p>
              <p className="mt-2 font-mono text-xs text-ink-muted">
                Backed by your Capability Statement, p.4.
              </p>
            </div>
            <div className="mt-4 border-t border-hairline pt-4">
              <ApprovalStamp />
            </div>
          </div>
        </Band>

        {/* Before and after: a ruled ledger (1px rules, no heavy ink). */}
        <Band>
          <Head>Before, and with Bidframe</Head>
          <div className="mt-7 overflow-x-auto">
            <table className="w-full max-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink">
                  <th className="w-[24%] py-3 pr-6" />
                  <th className="py-3 pr-6 font-serif text-base font-medium text-ink-muted">
                    Before
                  </th>
                  <th className="py-3 font-serif text-base font-medium text-ink">
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
          </div>
        </Band>
      </main>

      {/* Ink band 2: the closing. A lifted response card on the dark ground,
          carrying the one primary action: Book a demo. */}
      <section className="bg-ink">
        <div className={`${CONTAINER} py-20 sm:py-24`}>
          <div className="surface-grain mx-auto max-w-[600px] rounded-2xl border border-hairline bg-paper-raised p-8 text-center shadow-[var(--depth-sheet)] sm:p-10">
            <h2 className="mx-auto max-w-[20ch] font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
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

      <footer className="bg-ink text-paper">
        <div
          className={`${CONTAINER} flex flex-wrap items-end justify-between gap-4 border-t border-paper/15 py-8`}
        >
          <div>
            <BrandLogo reversed className="h-7 w-auto" />
            <p className="mt-2.5 text-sm text-paper/60">
              For SME bidders and small bid-writing consultancies.
            </p>
          </div>
          <Link
            href="/demo"
            className="rounded-sm text-sm text-paper/70 underline decoration-paper/30 decoration-1 underline-offset-4 transition-colors hover:text-paper"
          >
            See the demo
          </Link>
        </div>
      </footer>
    </div>
  );
}

// A paper section, left-aligned to the reading edge, separated by a section
// rule. Hierarchy from type and space, not boxes.
function Band({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-t border-rule-section">
      <div className={`${CONTAINER} py-16 sm:py-20`}>{children}</div>
    </section>
  );
}

function Head({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <h2
      className={`max-w-[20ch] font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl ${
        tone === "dark" ? "text-paper" : "text-ink"
      }`}
    >
      {children}
    </h2>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="max-w-[58ch]">
      <h3 className="font-serif text-xl font-medium text-ink">
        <span className="mr-3 font-mono text-base text-ink-muted">{n}</span>
        {title}
      </h3>
      <p className="mt-1.5 leading-relaxed text-ink-muted">{body}</p>
    </li>
  );
}

function ProofRow({ figure, label }: { figure: string; label: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 border-b border-paper/15 py-5 sm:gap-x-12">
      <dt className="min-w-[4ch] font-mono text-4xl font-medium leading-none text-paper sm:text-5xl">
        {figure}
      </dt>
      <dd className="leading-relaxed text-paper/75">{label}</dd>
    </div>
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
    <tr className="border-b border-hairline align-top">
      <th
        scope="row"
        className="py-3 pr-6 text-left font-mono text-xs font-normal uppercase tracking-wide text-ink-muted"
      >
        {label}
      </th>
      <td className="py-3 pr-6 text-ink-muted">{before}</td>
      <td className="py-3 text-ink">{after}</td>
    </tr>
  );
}
