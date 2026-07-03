"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BrandLogo } from "@/components/BrandLogo";
import {
  PitchScene,
  zoneIsDark,
  type PitchZone,
} from "@/components/pitch/PitchScene";
import { TrailMap } from "@/components/pitch/TrailMap";
import { TrailSteps } from "@/components/pitch/TrailSteps";
import {
  TenderGlyph,
  TENDER_STAGES,
  TENDER_STAGE_LABELS,
} from "@/components/pitch/TenderGlyph";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { GatingHero } from "@/components/GatingHero";
import { ComplianceMatrix } from "@/components/ComplianceMatrix";
import { AnswerCard } from "@/components/AnswerCard";
import { GraphView } from "@/components/GraphView";
import { useRequirements } from "@/context/RequirementsContext";
import { isBacked } from "@/lib/answers";
import { deriveTriage } from "@/lib/triage";
import type { Requirement } from "@/types/requirement";

const MAIN_SLIDE_COUNT = 7;
const AUTOPLAY_SECONDS = [20, 22, 23, 33, 34, 30, 18] as const;
const CTA =
  "Talk to us if you would like to help Bidframe scale the first-read layer for public-sector bids.";

const TEAM = [
  {
    name: "Jawad Jalal",
    role: "Frontend",
    image: "/pitch/team-jawad.svg",
  },
  {
    name: "Bobby Choi",
    role: "Generalist",
    image: "/pitch/team-bobby.svg",
  },
  {
    name: "Pranav Bonagiri",
    role: "Backend",
    image: "/pitch/team-pranav.svg",
  },
  {
    name: "Joel Jeon",
    role: "GTM, outreach, planning",
    image: "/pitch/team-joel.svg",
  },
] as const;

interface SlideMeta {
  bucket: string;
  title: string;
  speaker: string;
  notes: string[];
  // The walk: which woodland zone the slide stands in, and how much light has
  // reached it (0 = lost in the dark, 1 = the clearing).
  zone: PitchZone;
  light: number;
}

function pickEvidenceRequirement(requirements: Requirement[]) {
  return (
    requirements.find(
      (req) =>
        req.answer?.state === "auto" &&
        (req.answer?.evidence_refs.length ?? 0) > 0
    ) ??
    requirements.find((req) => (req.answer?.evidence_refs.length ?? 0) > 0) ??
    requirements[0]
  );
}

function Metric({
  label,
  value,
  count,
  suffix,
  tick,
}: {
  label: string;
  value?: string;
  // numeric metrics tick up when their slide arrives (tick flips remount the
  // counter with from=0); string values render as-is
  count?: number;
  suffix?: string;
  tick?: boolean;
}) {
  return (
    <div className="pitch-metric">
      <span>{label}</span>
      <strong>
        {count !== undefined ? (
          <>
            <AnimatedNumber
              key={tick ? "tick" : "idle"}
              value={count}
              from={tick ? 0 : count}
            />
            {suffix ? ` ${suffix}` : null}
          </>
        ) : (
          value
        )}
      </strong>
    </div>
  );
}

function SourceCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="pitch-source-card"
      target="_blank"
      rel="noreferrer"
    >
      <span>{title}</span>
      <p>{children}</p>
    </a>
  );
}

function TeamCard({
  name,
  role,
  image,
}: {
  name: string;
  role: string;
  image: string;
}) {
  return (
    <div className="pitch-team-card">
      <Image src={image} alt="" width={220} height={220} />
      <div>
        <strong>{name}</strong>
        <span>{role}</span>
      </div>
    </div>
  );
}

function IconPrevious() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11.5 4.5 7 9l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M6.5 4.5 11 9l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M6 4.5v9l7-4.5z" fill="currentColor" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M6 4h2v10H6zM10 4h2v10h-2z" fill="currentColor" />
    </svg>
  );
}

function IconFullscreen() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.5 7V3.5H7M11 3.5h3.5V7M14.5 11v3.5H11M7 14.5H3.5V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

export function PitchDeck() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const { requirements, title } = useRequirements();
  const [activeIndex, setActiveIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [autoplay, setAutoplay] = useState(false);

  const triage = useMemo(() => deriveTriage(requirements), [requirements]);
  const collapsedGroups = useMemo<Set<string>>(() => new Set(["decided"]), []);
  const dealBreakers = useMemo(
    () => requirements.filter((req) => req.is_gating),
    [requirements]
  );
  const evidenceReq = useMemo(
    () => pickEvidenceRequirement(requirements),
    [requirements]
  );
  const backedCount = useMemo(
    () => requirements.filter((req) => isBacked(req)).length,
    [requirements]
  );
  const openQuestionCount = useMemo(
    () =>
      requirements.reduce(
        (sum, req) =>
          sum +
          (req.open_questions ?? []).filter((question) => question.answer === null)
            .length,
        0
      ),
    [requirements]
  );

  const next = useCallback(() => {
    setAutoplay(false);
    setActiveIndex((current) => Math.min(current + 1, 11));
  }, []);

  const previous = useCallback(() => {
    setAutoplay(false);
    setActiveIndex((current) => Math.max(current - 1, 0));
  }, []);

  const toggleAutoplay = useCallback(() => {
    setAutoplay((current) => !current);
    if (!autoplay) {
      setActiveIndex((index) => (index >= MAIN_SLIDE_COUNT ? 0 : index));
    }
  }, [autoplay]);

  const toggleFullscreen = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (stage.requestFullscreen) {
      void stage.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)
      ) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        previous();
      } else if (event.key === " ") {
        event.preventDefault();
        next();
      } else if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        toggleAutoplay();
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        setNotesOpen((open) => !open);
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        toggleFullscreen();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, previous, toggleAutoplay, toggleFullscreen]);

  useEffect(() => {
    if (!autoplay) return;
    if (activeIndex >= MAIN_SLIDE_COUNT) return;

    const timeout = window.setTimeout(() => {
      if (activeIndex === MAIN_SLIDE_COUNT - 1) {
        setAutoplay(false);
      } else {
        setActiveIndex((current) => Math.min(current + 1, MAIN_SLIDE_COUNT - 1));
      }
    }, AUTOPLAY_SECONDS[activeIndex] * 1000);

    return () => window.clearTimeout(timeout);
  }, [activeIndex, autoplay]);

  const slides = useMemo(
    () =>
      [
        {
          bucket: "Problem",
          title: "One missed deal-breaker kills the bid",
          speaker: "Jawad",
          zone: "night",
          light: 0.05,
          notes: [
            "Open with the plain-language definition: a tender is the buyer's official request to bid, with pass/fail requirements and evidence asks.",
            "Say the full thought out loud: hidden inside are pass/fail clauses, scored requirements and evidence asks — miss one gate and the answer is no.",
            "Make the pain concrete: the first read is where teams hunt for disqualifiers.",
            "Hand to Bobby on the workflow, not a feature list.",
          ],
          body: (
            <div className="pitch-poster">
              <p className="pitch-kicker">A tender, in plain English</p>
              <h1>
                One missed deal&#8209;breaker
                <br />
                kills the bid
              </h1>
              <p className="pitch-poster__line">
                Somewhere in the pack is a clause that ends it.
              </p>
              <p className="pitch-poster__terms">
                Requirement · Evidence · Compliance matrix · Deal-breaker
              </p>
            </div>
          ),
        },
        {
          bucket: "Use Case",
          title: "The bid manager's first read",
          speaker: "Bobby",
          zone: "pine",
          light: 0.3,
          notes: [
            "Frame the user: a bid manager opens a public-sector tender and needs a fast, defensible first read.",
            "Say it in full: the first job is not writing — it is finding the pass/fail clauses and the proof needed to answer safely.",
            "Use the market size as context, not a top-down TAM claim.",
            "Make the journey feel operational: read, sort, prove, decide.",
          ],
          body: (
            <div className="pitch-journey">
              <div className="pitch-journey__head">
                <p className="pitch-kicker">The use case</p>
                <h2>The first read decides what happens next</h2>
              </div>
              <TrailSteps
                steps={[
                  {
                    title: "Open tender",
                    copy: "PDF pack lands with legal wording",
                  },
                  { title: "Find risks", copy: "Gating clauses rise first" },
                  { title: "Build matrix", copy: "Every line gets a source" },
                  {
                    title: "Draft safely",
                    copy: "Answers carry evidence receipts",
                  },
                ]}
              />
              <div className="pitch-journey__stat">
                <span className="pitch-journey__figure">£341bn</span>
                <span className="pitch-journey__note">
                  UK public procurement, 2023/24 · about a third of public
                  spend · new rules live since 24 Feb 2025
                </span>
              </div>
            </div>
          ),
        },
        {
          bucket: "Solution",
          title: "A marked trail through the tender",
          speaker: "Pranav",
          zone: "night",
          light: 0.12,
          notes: [
            "This is the stop-sign in the forest: let the pulse land, pause, then read the clause out loud.",
            "Say it in full: Bidframe turns the tender into a reviewable matrix — deal-breakers first, uncertainty visible, sources attached.",
            "The card is a real gating requirement from the SPSO run, with its clause and page. This is where the room should understand the wedge.",
            "Avoid claiming universal accuracy. This is a real pre-baked run.",
          ],
          body: (
            <div className="pitch-moment">
              <p className="pitch-kicker">The solution</p>
              <h2>Find the clause that can void the bid</h2>
              <div className="pitch-stopsign">
                <span className="pitch-stopsign__blaze" aria-hidden="true" />
                <p className="pitch-stopsign__caption">
                  This is the line that would kill the bid
                </p>
                {dealBreakers[0] && (
                  <div className="pitch-stopsign__card">
                    <span>
                      {dealBreakers[0].source_clause} · p.
                      {dealBreakers[0].source_page}
                    </span>
                    <strong>{dealBreakers[0].text}</strong>
                    <em>Caught — surfaced first, before a word is written.</em>
                  </div>
                )}
              </div>
            </div>
          ),
        },
        {
          bucket: "Product",
          title: "Deal-breakers first. Every line checkable.",
          speaker: "Joel",
          zone: "moss",
          light: 0.6,
          notes: [
            "Lead with the product proof: the first screen tells a bid team what can disqualify them.",
            "Say it in full: the product shows the requirement, why it matters, where it came from, and what evidence backs the draft answer.",
            "Then show evidence-backed answer drafting as the second layer, not the first claim.",
            "Use worked-example language for the numbers.",
          ],
          body: (
            <div className="pitch-spread">
              <div className="pitch-copy">
                <p className="pitch-kicker">The product</p>
                <h2>The tender becomes a checkable map</h2>
                <p>Every line shows where it came from.</p>
                <div className="pitch-mini-metrics">
                  <Metric
                    label="Worked example rows"
                    count={requirements.length}
                    tick={activeIndex === 3}
                  />
                  <Metric
                    label="Deal-breakers surfaced"
                    count={dealBreakers.length}
                    tick={activeIndex === 3}
                  />
                  <Metric
                    label="Backed drafts with receipts"
                    count={backedCount}
                    tick={activeIndex === 3}
                  />
                </div>
              </div>
              <div className="pitch-sheet">
                <div className="pitch-sheet__caption">
                  <span>First screen</span>
                  <strong>The risk is visible</strong>
                </div>
                <div className="pitch-sheet__window">
                  <GatingHero requirements={requirements} />
                </div>
                {evidenceReq && (
                  <>
                    <div className="pitch-sheet__caption">
                      <span>Answer layer</span>
                      <strong>Draft with receipts</strong>
                    </div>
                    <ul className="pitch-sheet__window pitch-answer-preview">
                      <AnswerCard requirement={evidenceReq} />
                    </ul>
                  </>
                )}
              </div>
            </div>
          ),
        },
        {
          bucket: "Demo Flow",
          title: "PDF to matrix to proof to answer",
          speaker: "Joel lead / Bobby support",
          zone: "paper",
          light: 0.75,
          notes: [
            "Keep this as a quick route map for the live demo.",
            "Say it in full: the trusted demo path is a cached real SPSO run, ready on stage without backend or model variance.",
            "Joel: PDF to matrix and deal-breaker view. Bobby: proof, answer receipts and demo reliability.",
            "Use bidframe.org/demo as the secondary CTA after the pitch.",
          ],
          body: (
            <div className="pitch-spread">
              <div className="pitch-copy">
                <p className="pitch-kicker">Demo flow</p>
                <h2>PDF to matrix to proof to answer</h2>
                <p>A real tender, cached. Nothing on stage is staged.</p>
                <ol className="pitch-flow-list">
                  {[
                    ["PDF", "tender pack"],
                    ["Matrix", "requirements grouped"],
                    ["Proof", "source line and clause"],
                    ["Answer", "evidence receipts"],
                  ].map(([label, copy], i) => (
                    <li key={label}>
                      <span>0{i + 1}</span>
                      <strong>{label}</strong> — {copy}
                    </li>
                  ))}
                </ol>
                <div className="pitch-demo-links">
                  <a href="https://bidframe.org">bidframe.org</a>
                  <Link href="/demo">bidframe.org/demo</Link>
                </div>
              </div>
              <div className="pitch-sheet">
                <div className="pitch-sheet__caption">
                  <span>Read-only stage</span>
                  <strong>Live product surface</strong>
                </div>
                <div className="pitch-sheet__window pitch-sheet__window--fill">
                  <ComplianceMatrix
                    groups={triage.groups}
                    selectedId={null}
                    onSelect={() => {}}
                    onApprove={() => {}}
                    activeFilter={null}
                    collapsed={collapsedGroups}
                    onToggleGroup={() => {}}
                    density="compact"
                  />
                </div>
              </div>
            </div>
          ),
        },
        {
          bucket: "Tech",
          title: "A trust layer, not a PDF chatbot",
          speaker: "Pranav",
          zone: "pine",
          light: 0.5,
          notes: [
            "Make the architecture understandable: ingest, extract, reconcile, route, cite and evaluate.",
            "Say it in full: it creates structured records — extracted requirements, conservative reconciliation, source citations and answer receipts.",
            "Contrast with a PDF chatbot without naming competitors. Bidframe produces a structured review layer.",
            "Point at the graph as traceability and dependency structure.",
          ],
          body: (
            <div className="pitch-spread">
              <div className="pitch-copy">
                <p className="pitch-kicker">The tech</p>
                <h2>A trust layer, not a PDF chatbot</h2>
                <p>Structured records, with receipts.</p>
                <p className="pitch-poster__terms">
                  FastAPI · Python engine · Next.js · Eval harness
                </p>
              </div>
              <div className="pitch-sheet pitch-sheet--tech">
                <div className="pitch-pipeline">
                  {[
                    "PDF ingest",
                    "Requirement extraction",
                    "Dedupe and routing",
                    "Deal-breaker detection",
                    "Source matrix",
                    "Answer receipts",
                  ].map((step) => (
                    <span key={step}>{step}</span>
                  ))}
                </div>
                <div className="pitch-sheet__window pitch-sheet__window--fill">
                  <GraphView interactive={false} embedded />
                </div>
              </div>
            </div>
          ),
        },
        {
          bucket: "Ask",
          title: "Help us scale the first-read layer",
          speaker: "Jawad",
          zone: "clearing",
          light: 1,
          notes: [
            "Close with confidence and invite a conversation, not a generic fundraising line.",
            `Say it in full: ${CTA}`,
            "Primary CTA is bidframe.org. Secondary CTA is bidframe.org/demo.",
            "Leave space for investor/advisor questions on procurement, accuracy and distribution.",
          ],
          body: (
            <div className="pitch-poster pitch-poster--center">
              <p className="pitch-kicker">The ask</p>
              <h2>Help us scale the first&#8209;read layer</h2>
              <p className="pitch-poster__line">
                Invest, advise, or introduce us.
              </p>
              <div className="pitch-cta-row">
                <a href="https://bidframe.org">bidframe.org</a>
                <Link href="/demo">bidframe.org/demo</Link>
              </div>
            </div>
          ),
        },
        {
          bucket: "Appendix",
          title: "Team",
          speaker: "Q&A",
          zone: "paper",
          light: 0.85,
          notes: [
            "Keep this for Q&A. The main deck only needs names and roles if asked.",
          ],
          body: (
            <div className="pitch-appendix">
              <div className="pitch-copy">
                <p className="pitch-kicker">Team</p>
                <h2>Built by a small team with clear lanes</h2>
                <p>
                  Primary roles, with everyone pitching in across the product.
                </p>
              </div>
              <div className="pitch-team-grid">
                {TEAM.map((member) => (
                  <TeamCard key={member.name} {...member} />
                ))}
              </div>
            </div>
          ),
        },
        {
          bucket: "Appendix",
          title: "Proof ledger",
          speaker: "Q&A",
          zone: "paper",
          light: 0.85,
          notes: [
            "Use this if asked what is proven versus what is still scoped.",
            "Keep every claim tied to the worked example or repo evidence.",
          ],
          body: (
            <div className="pitch-appendix pitch-appendix--ledger">
              <div className="pitch-copy">
                <p className="pitch-kicker">Proof ledger</p>
                <h2>What we can safely claim today</h2>
              </div>
              <div className="pitch-ledger-grid">
                <Metric label="Worked example" value={title} />
                <Metric
                  label="Rows extracted"
                  count={requirements.length}
                  suffix="requirements"
                  tick={activeIndex === 8}
                />
                <Metric
                  label="Deal-breaker detector"
                  count={dealBreakers.length}
                  suffix="rows surfaced"
                  tick={activeIndex === 8}
                />
                <Metric
                  label="Answer receipts"
                  count={backedCount}
                  suffix="backed drafts"
                  tick={activeIndex === 8}
                />
                <Metric
                  label="Human gaps"
                  count={openQuestionCount}
                  suffix="open prompts"
                  tick={activeIndex === 8}
                />
                <Metric label="Scope" value="pre-baked real run" />
              </div>
              <p className="pitch-caveat">
                In this worked example the pipeline surfaces the deal-breaker rows
                first and keeps each line traceable to its source. And the
                deal-breaker detector is validated beyond it: every disqualifier
                caught across our gold tenders (SPSO 2/2, museum 10/10)
                deterministically, without the model — guaranteed, not luck — plus
                10/10 on the held-out Bradwell tender and 101/101 on a worst-case
                phrasing bank. It is tuned recall-first, so the failure mode is
                over-flagging, never a silent miss. We do not put a headline
                precision number on stage — broader accuracy across every
                requirement type is still small-sample, and we say so.
              </p>
            </div>
          ),
        },
        {
          bucket: "Appendix",
          title: "Market sources",
          speaker: "Q&A",
          zone: "paper",
          light: 0.85,
          notes: [
            "Use this only when asked about market size or timing.",
            "The main pitch should stay on workflow pain and product proof.",
          ],
          body: (
            <div className="pitch-appendix">
              <div className="pitch-copy">
                <p className="pitch-kicker">Market sources</p>
                <h2>Procurement is large, regulated and paperwork-heavy</h2>
              </div>
              <div className="pitch-source-grid">
                <SourceCard
                  title="House of Commons Library"
                  href="https://commonslibrary.parliament.uk/research-briefings/cbp-9317/"
                >
                  Latest Whole of Government Accounts data cited GBP341bn spent
                  on procurement in 2023/24, about a third of public-sector
                  spending.
                </SourceCard>
                <SourceCard
                  title="House of Commons Library"
                  href="https://commonslibrary.parliament.uk/research-briefings/cbp-9317/"
                >
                  SME procurement data is useful but caveated: the last central
                  government SME edition cited 26.5 percent in 2021/22 and warns
                  methods changed over time.
                </SourceCard>
                <SourceCard
                  title="GOV.UK"
                  href="https://www.gov.uk/government/publications/national-procurement-policy-statement"
                >
                  The National Procurement Policy Statement came into effect on
                  24 February 2025 alongside introduction of the Procurement Act
                  2023.
                </SourceCard>
              </div>
            </div>
          ),
        },
        {
          bucket: "Appendix",
          title: "Demo reliability",
          speaker: "Q&A",
          zone: "paper",
          light: 0.85,
          notes: [
            "This is the answer if someone asks whether the demo is live inference.",
            "Be clear: the stage deck uses a cached real run; the live product route remains available.",
          ],
          body: (
            <div className="pitch-appendix pitch-appendix--split">
              <div className="pitch-copy">
                <p className="pitch-kicker">Demo reliability</p>
                <h2>Stage-safe without pretending</h2>
                <p>
                  /pitch and /demo use cached SPSO output from a real pipeline
                  run. The live route remains available after the pitch.
                </p>
              </div>
              <div className="pitch-reliability-list">
                <span>Primary pitch: /pitch</span>
                <span>Secondary demo: /demo</span>
                <span>Answer workspace: /answers</span>
                <span>Fallback: browser PDF and screenshots in outputs</span>
              </div>
            </div>
          ),
        },
        {
          bucket: "Appendix",
          title: "Competitive wedge",
          speaker: "Q&A",
          zone: "paper",
          light: 0.85,
          notes: [
            "Use this for positioning questions.",
            "The wedge is before bid-writing: the first-read layer and deal-breaker detection.",
          ],
          body: (
            <div className="pitch-appendix pitch-appendix--wedge">
              <div className="pitch-copy">
                <p className="pitch-kicker">Competitive wedge</p>
                <h2>Before writing, the bid needs a first read</h2>
                <p>
                  Bidframe starts where bid tools usually skip: the
                  source-checkable review layer before bid-writing.
                </p>
              </div>
              <div className="pitch-wedge-grid">
                <div>
                  <strong>Not a document chat</strong>
                  <span>Structured rows, sources, categories and decisions.</span>
                </div>
                <div>
                  <strong>Not a writing toy</strong>
                  <span>Deal-breaker detection before generation.</span>
                </div>
                <div>
                  <strong>Not a static spreadsheet</strong>
                  <span>Evidence-backed answers and human gaps.</span>
                </div>
              </div>
            </div>
          ),
        },
      ] satisfies Array<SlideMeta & { body: React.ReactNode }>,
    [
      activeIndex,
      backedCount,
      collapsedGroups,
      dealBreakers,
      evidenceReq,
      openQuestionCount,
      requirements,
      title,
      triage.groups,
    ]
  );

  const activeSlide = slides[activeIndex];
  const inAppendix = activeIndex >= MAIN_SLIDE_COUNT;
  const trailLabels = useMemo(
    () => slides.slice(0, MAIN_SLIDE_COUNT).map((slide) => slide.bucket),
    [slides]
  );

  return (
    <main className="pitch-scope">
      <div className="pitch-shell">
        <div
          className="pitch-stage"
          ref={stageRef}
          aria-label="Bidframe pitch deck"
        >
          <PitchScene
            zone={activeSlide.zone}
            light={activeSlide.light}
            step={activeIndex}
          />

          <button
            type="button"
            className="pitch-click-zone pitch-click-zone--left no-print"
            aria-label="Previous slide"
            onClick={previous}
            disabled={activeIndex === 0}
          />
          <button
            type="button"
            className="pitch-click-zone pitch-click-zone--right no-print"
            aria-label="Next slide"
            onClick={next}
            disabled={activeIndex === slides.length - 1}
          />

          {slides.map((slide, index) => (
            <section
              key={`${slide.bucket}-${slide.title}`}
              className={`pitch-slide pitch-slide--${slide.zone} ${
                zoneIsDark(slide.zone)
                  ? "pitch-slide--ondark"
                  : "pitch-slide--onlight"
              } ${index === activeIndex ? "is-active" : ""}`}
              aria-hidden={index === activeIndex ? undefined : true}
            >
              <div className="pitch-slide-topline">
                <BrandLogo
                  reversed={zoneIsDark(slide.zone)}
                  className="h-8 w-auto"
                />
                <div>
                  <span>{slide.bucket}</span>
                </div>
              </div>
              <div className="pitch-slide-body">{slide.body}</div>
            </section>
          ))}

          {/* the story object: one tender page carried through the walk */}
          <div
            className={`pitch-story no-print ${
              inAppendix ? "is-hidden" : ""
            } ${zoneIsDark(activeSlide.zone) ? "" : "pitch-story--ink"}`}
            aria-hidden="true"
          >
            <TenderGlyph stage={TENDER_STAGES[Math.min(activeIndex, 6)]} />
            <span>{TENDER_STAGE_LABELS[TENDER_STAGES[Math.min(activeIndex, 6)]]}</span>
          </div>

          <TrailMap
            labels={trailLabels}
            activeIndex={activeIndex}
            offTrail={inAppendix}
            onSelect={(index) => {
              setAutoplay(false);
              setActiveIndex(index);
            }}
          />

          <div className="pitch-controls no-print">
            <button
              type="button"
              onClick={previous}
              disabled={activeIndex === 0}
              aria-label="Previous slide"
            >
              <IconPrevious />
            </button>
            <div className="pitch-counter">
              <strong>
                {inAppendix
                  ? `Notes ${activeIndex - MAIN_SLIDE_COUNT + 1}/${
                      slides.length - MAIN_SLIDE_COUNT
                    }`
                  : `${activeIndex + 1} / ${MAIN_SLIDE_COUNT}`}
              </strong>
            </div>
            <button
              type="button"
              onClick={next}
              disabled={activeIndex === slides.length - 1}
              aria-label="Next slide"
            >
              <IconNext />
            </button>
            <button
              type="button"
              onClick={toggleAutoplay}
              aria-pressed={autoplay}
              aria-label={autoplay ? "Stop autoplay" : "Start autoplay"}
              className={autoplay ? "is-active" : ""}
            >
              {autoplay ? <IconPause /> : <IconPlay />}
            </button>
            <button
              type="button"
              onClick={() => setNotesOpen((open) => !open)}
              aria-pressed={notesOpen}
              aria-label="Toggle presenter notes"
              className={notesOpen ? "is-active" : ""}
            >
              <span aria-hidden="true">N</span>
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
            >
              <IconFullscreen />
            </button>
          </div>

          {notesOpen && (
            <aside className="pitch-notes no-print">
              <p>
                {activeSlide.speaker} - {activeSlide.title}
              </p>
              <ul>
                {activeSlide.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
