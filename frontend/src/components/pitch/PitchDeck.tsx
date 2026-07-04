"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  TENDER_STAGE_LABELS,
  type TenderStage,
} from "@/components/pitch/TenderGlyph";
import { TenderPageFacsimile } from "@/components/pitch/TenderPageFacsimile";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { GatingHero } from "@/components/GatingHero";
import { GraphView } from "@/components/GraphView";
import { MatrixView } from "@/components/MatrixView";
import { useRequirements } from "@/context/RequirementsContext";
import { isBacked } from "@/lib/answers";

// The 3-minute deck: five slides, three speakers (Jawad, Bobby, Pranav).
// Joel takes the mic after the Product slide for the 2-minute live demo.
const MAIN_SLIDE_COUNT = 5;
const APPENDIX_SLIDE_COUNT = 6;
const TOTAL_SLIDE_COUNT = MAIN_SLIDE_COUNT + APPENDIX_SLIDE_COUNT;
// The Solution slide (0-based): the deck's two-beat dramatic moment.
const STOPSIGN_INDEX = 2;
// The Product slide: where the walk-into-the-product portal opens.
const PRODUCT_INDEX = 3;
// Sums to 170s — ten seconds of handoff slack inside the 3:00 window.
const AUTOPLAY_SECONDS = [24, 30, 40, 46, 30] as const;
// Where the clock *should* be when each main slide starts (pace ghost).
const PACE_STARTS = AUTOPLAY_SECONDS.map((_, i) =>
  AUTOPLAY_SECONDS.slice(0, i).reduce((sum, s) => sum + s, 0)
);
// v2: slide indices changed when the deck went from 7 to 5 main slides.
const PITCH_STATE_KEY = "bidframe.pitch.state.v2";
const CTA =
  "Talk to us if you would like to help Bidframe scale the first-read layer for public-sector bids.";

interface PitchStoredState {
  activeIndex: number;
  beat: number;
  notesOpen: boolean;
  elapsedSeconds: number;
}

const TEAM = [
  { name: "Jawad Jalal", role: "Frontend" },
  { name: "Bobby Choi", role: "Generalist" },
  { name: "Pranav Bonagiri", role: "Backend" },
  { name: "Joel Jeon", role: "GTM, outreach, planning" },
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
  // The story object's stage on this slide (the carried tender page).
  glyph: TenderStage;
  // Overrides the derived "next speaker" chip — e.g. the handoff into
  // Joel's live demo, which is not a deck slide.
  nextUp?: string;
}

function clampSlideIndex(index: number) {
  return Math.min(Math.max(index, 0), TOTAL_SLIDE_COUNT - 1);
}

function parsePitchHash(hash: string) {
  const cleaned = hash.replace(/^#/, "").trim().toLowerCase();
  if (!cleaned) return null;

  const noteMatch = /^notes?-(\d+)$/.exec(cleaned);
  if (noteMatch) {
    const noteIndex = Number(noteMatch[1]) - 1;
    if (noteIndex >= 0 && noteIndex < APPENDIX_SLIDE_COUNT) {
      return MAIN_SLIDE_COUNT + noteIndex;
    }
  }

  const slideMatch = /^(?:slide-)?(\d+)$/.exec(cleaned);
  if (!slideMatch) return null;

  const index = Number(slideMatch[1]) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= TOTAL_SLIDE_COUNT) {
    return null;
  }
  return index;
}

function hashForIndex(index: number) {
  if (index >= MAIN_SLIDE_COUNT) {
    return `#notes-${index - MAIN_SLIDE_COUNT + 1}`;
  }
  return `#${index + 1}`;
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function readStoredPitchState(): PitchStoredState | null {
  try {
    const raw = window.sessionStorage.getItem(PITCH_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PitchStoredState>;
    const activeIndex = parsed.activeIndex;
    const elapsedSeconds = parsed.elapsedSeconds;
    if (typeof activeIndex !== "number" || !Number.isInteger(activeIndex)) {
      return null;
    }
    return {
      activeIndex: clampSlideIndex(activeIndex),
      beat: parsed.beat === 1 ? 1 : 0,
      notesOpen: parsed.notesOpen === true,
      elapsedSeconds:
        typeof elapsedSeconds === "number" && Number.isInteger(elapsedSeconds)
          ? Math.max(0, elapsedSeconds)
          : 0,
    };
  } catch {
    return null;
  }
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

function TeamCard({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("");
  return (
    <div className="pitch-team-card">
      <span className="pitch-team-card__monogram" aria-hidden="true">
        {initials}
      </span>
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
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cursorTimerRef = useRef<number | null>(null);
  const { requirements, title } = useRequirements();
  const [activeIndex, setActiveIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [restored, setRestored] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cursorHidden, setCursorHidden] = useState(false);
  const [sourcePeekOpen, setSourcePeekOpen] = useState(false);
  // The stop-sign slide plays in two beats: 0 = the clause alone, 1 = caught.
  const [beat, setBeat] = useState(0);
  // Walk-into-the-product: the real MatrixView over the frozen Bradwell run,
  // opened from the Product slide without leaving the stage.
  const [portalOpen, setPortalOpen] = useState(false);
  // Rehearsal HUD: big speaker name + per-slide countdown, for practice runs.
  const [rehearsal, setRehearsal] = useState(false);
  // Seconds spent on the current slide (drives the rehearsal countdown).
  const [slideSeconds, setSlideSeconds] = useState(0);

  const dealBreakers = useMemo(
    () => requirements.filter((req) => req.is_gating),
    [requirements]
  );
  const splitDealBreakers = useMemo(
    () => dealBreakers.slice(0, 5),
    [dealBreakers]
  );
  const sourceProofReq = useMemo(
    () =>
      dealBreakers.find((req) => req.source_excerpt) ??
      dealBreakers[0] ??
      requirements.find((req) => req.source_excerpt) ??
      requirements[0],
    [dealBreakers, requirements]
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
    if (activeIndex === STOPSIGN_INDEX && beat === 0) {
      setBeat(1);
      return;
    }
    // Advancing past the Ask hands the stage to the live demo: straight to
    // /showcase. The appendix stays reachable via Q or the trail's side path.
    if (activeIndex === MAIN_SLIDE_COUNT - 1) {
      router.push("/showcase");
      return;
    }
    setBeat(0);
    setSlideSeconds(0);
    setActiveIndex((current) => Math.min(current + 1, TOTAL_SLIDE_COUNT - 1));
  }, [activeIndex, beat, router]);

  const previous = useCallback(() => {
    setAutoplay(false);
    if (activeIndex === STOPSIGN_INDEX && beat === 1) {
      setBeat(0);
      return;
    }
    const target = Math.max(activeIndex - 1, 0);
    // walking backwards re-enters the stop-sign already resolved
    setBeat(target === STOPSIGN_INDEX ? 1 : 0);
    setSlideSeconds(0);
    setActiveIndex(target);
  }, [activeIndex, beat]);

  // Direct jumps (trail map, number keys) land on the finished state.
  const goTo = useCallback((index: number) => {
    setAutoplay(false);
    const target = clampSlideIndex(index);
    setBeat(target === STOPSIGN_INDEX ? 1 : 0);
    setSlideSeconds(0);
    setActiveIndex(target);
  }, []);

  const resetToStart = useCallback(() => {
    setAutoplay(false);
    setBeat(0);
    setElapsedSeconds(0);
    setSlideSeconds(0);
    setActiveIndex(0);
  }, []);

  const jumpToAsk = useCallback(() => {
    setAutoplay(false);
    setBeat(0);
    setSlideSeconds(0);
    setActiveIndex(MAIN_SLIDE_COUNT - 1);
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

  // Walk into the product: land on the Product slide and open the real
  // MatrixView over the frozen run. Esc walks back to the exact slide state.
  const openPortal = useCallback(() => {
    setAutoplay(false);
    setBeat(0);
    setActiveIndex(PRODUCT_INDEX);
    setPortalOpen(true);
  }, []);

  const toggleRehearsal = useCallback(() => {
    const enabled = !rehearsal;
    setRehearsal(enabled);
    setAutoplay(enabled);
    if (enabled) {
      setActiveIndex((index) => (index >= MAIN_SLIDE_COUNT ? 0 : index));
      setElapsedSeconds(0);
      setSlideSeconds(0);
    }
  }, [rehearsal]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // While the portal is open the product owns the keyboard (command
      // palette, matrix shortcuts). The deck only listens for Escape.
      if (portalOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          setPortalOpen(false);
        }
        return;
      }

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
      } else if (event.key === "Enter" && activeIndex === PRODUCT_INDEX) {
        event.preventDefault();
        openPortal();
      } else if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        openPortal();
      } else if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        toggleAutoplay();
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        toggleRehearsal();
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        setNotesOpen((open) => !open);
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key >= "1" && event.key <= "5") {
        event.preventDefault();
        goTo(Number(event.key) - 1);
      } else if (event.key.toLowerCase() === "q") {
        event.preventDefault();
        goTo(MAIN_SLIDE_COUNT);
      } else if (event.key === "?") {
        event.preventDefault();
        setHelpOpen((open) => !open);
      } else if (event.key === "Home") {
        event.preventDefault();
        resetToStart();
      } else if (event.key === "End") {
        event.preventDefault();
        jumpToAsk();
      } else if (event.key === "Escape") {
        setHelpOpen(false);
        setNotesOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeIndex,
    next,
    openPortal,
    portalOpen,
    previous,
    goTo,
    resetToStart,
    jumpToAsk,
    toggleAutoplay,
    toggleFullscreen,
    toggleRehearsal,
  ]);

  useEffect(() => {
    const restoreFrame = window.requestAnimationFrame(() => {
      const hashIndex = parsePitchHash(window.location.hash);
      const stored = readStoredPitchState();
      const targetIndex = hashIndex ?? stored?.activeIndex ?? 0;
      const restoredBeat =
        hashIndex !== null
          ? targetIndex === STOPSIGN_INDEX
            ? 1
            : 0
          : stored?.beat ?? 0;

      setActiveIndex(clampSlideIndex(targetIndex));
      setBeat(restoredBeat);
      setNotesOpen(hashIndex !== null ? false : stored?.notesOpen ?? false);
      setElapsedSeconds(stored?.elapsedSeconds ?? 0);
      setRestored(true);
    });

    return () => window.cancelAnimationFrame(restoreFrame);
  }, []);

  useEffect(() => {
    if (!restored) return;
    const state: PitchStoredState = {
      activeIndex,
      beat,
      notesOpen,
      elapsedSeconds,
    };
    window.sessionStorage.setItem(PITCH_STATE_KEY, JSON.stringify(state));

    const nextHash = hashForIndex(activeIndex);
    if (window.location.hash !== nextHash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${nextHash}`
      );
    }
  }, [activeIndex, beat, elapsedSeconds, notesOpen, restored]);

  // The Ask's NEXT press cuts to the live demo — have /showcase ready.
  useEffect(() => {
    router.prefetch("/showcase");
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
      setSlideSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    function clearCursorTimer() {
      if (cursorTimerRef.current !== null) {
        window.clearTimeout(cursorTimerRef.current);
        cursorTimerRef.current = null;
      }
    }

    function showCursorThenHide() {
      setCursorHidden(false);
      clearCursorTimer();
      cursorTimerRef.current = window.setTimeout(() => {
        if (document.fullscreenElement === stage) {
          setCursorHidden(true);
        }
      }, 2000);
    }

    function onFullscreenChange() {
      if (document.fullscreenElement === stage) {
        showCursorThenHide();
      } else {
        clearCursorTimer();
        setCursorHidden(false);
      }
    }

    stage.addEventListener("mousemove", showCursorThenHide);
    stage.addEventListener("mousedown", showCursorThenHide);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      clearCursorTimer();
      stage.removeEventListener("mousemove", showCursorThenHide);
      stage.removeEventListener("mousedown", showCursorThenHide);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    if (activeIndex >= MAIN_SLIDE_COUNT) return;

    // Autoplay fires the stop-sign's second beat partway through the slide.
    const beatTimeout =
      activeIndex === STOPSIGN_INDEX
        ? window.setTimeout(
            () => setBeat(1),
            AUTOPLAY_SECONDS[STOPSIGN_INDEX] * 450
          )
        : null;

    const timeout = window.setTimeout(() => {
      if (activeIndex === MAIN_SLIDE_COUNT - 1) {
        setAutoplay(false);
      } else {
        setBeat(0);
        setSlideSeconds(0);
        setActiveIndex((current) => Math.min(current + 1, MAIN_SLIDE_COUNT - 1));
      }
    }, AUTOPLAY_SECONDS[activeIndex] * 1000);

    return () => {
      if (beatTimeout !== null) window.clearTimeout(beatTimeout);
      window.clearTimeout(timeout);
    };
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
          glyph: "pdf",
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
          glyph: "read",
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
                <span
                  className="pitch-journey__figure"
                  aria-label="341 billion pounds"
                >
                  £
                  <AnimatedNumber
                    key={activeIndex === 1 ? "gbp-active" : "gbp-idle"}
                    value={341}
                    from={activeIndex === 1 ? 0 : 341}
                  />
                  bn
                </span>
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
          title: "The tender becomes a deal-breaker view",
          speaker: "Pranav",
          zone: "night",
          light: 0.12,
          glyph: "clause",
          notes: [
            "Two beats: first hold on the typeset clause 4.6 page. It should feel dense and easy to miss.",
            "The NEXT keypress marks the five buried disqualifiers and resolves to the split: page left, Bidframe deal-breaker view right.",
            "Say it in full: this is the same tender turned into a reviewable matrix, with deal-breakers first and sources attached.",
            "Avoid claiming universal accuracy. This is a real pre-baked Bradwell run.",
          ],
          body: (
            <div
              className={`pitch-before-after ${
                beat > 0 ? "is-revealed" : ""
              }`}
            >
              <div className="pitch-before-after__copy">
                <p className="pitch-kicker">The solution</p>
                <h2>One clause. Five ways to lose the bid.</h2>
              </div>
              <div className="pitch-before-after__stage">
                <figure className="pitch-before-after__panel pitch-before-after__panel--before">
                  <figcaption className="pitch-before-after__label">
                    <span>The tender. 34 pages.</span>
                  </figcaption>
                  <div className="pitch-before-after__document">
                    <TenderPageFacsimile highlighted={beat > 0} />
                  </div>
                </figure>
                <section
                  className="pitch-before-after__panel pitch-before-after__panel--after"
                  aria-hidden={beat === 0 ? true : undefined}
                >
                  <div className="pitch-before-after__label">
                    <span>Bidframe. Deal-breakers first.</span>
                  </div>
                  <div className="pitch-before-after__summary">
                    <span>{dealBreakers.length}</span>
                    <div>
                      <strong>deal-breakers</strong>
                      <em>surfaced before writing starts</em>
                    </div>
                  </div>
                  <ul className="pitch-before-after__rows">
                    {splitDealBreakers.map((req, index) => (
                      <li key={req.id}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <strong>{req.text}</strong>
                          <em>
                            p.{req.source_page}
                            {req.source_clause
                              ? ` · ${req.source_clause}`
                              : ""}
                          </em>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="pitch-before-after__receipt">
                    Every row keeps the page and clause attached.
                  </p>
                </section>
              </div>
            </div>
          ),
        },
        {
          bucket: "Product",
          title: "Deal-breakers first. Every line checkable.",
          speaker: "Pranav",
          zone: "moss",
          light: 0.6,
          glyph: "matrix",
          nextUp: "Joel · demo",
          notes: [
            "Lead with the product proof: the first screen tells a bid team what can disqualify them.",
            "One click on Source proof shows the receipt — every line traceable to page and clause.",
            "Press Enter (or P) to step INSIDE the real product if the room wants a peek — Esc walks back.",
            "Then hand the mic to Joel for the 2-minute live walkthrough on /showcase.",
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
                    tick={activeIndex === PRODUCT_INDEX}
                  />
                  <Metric
                    label="Deal-breakers surfaced"
                    count={dealBreakers.length}
                    tick={activeIndex === PRODUCT_INDEX}
                  />
                </div>
                <button
                  type="button"
                  className="pitch-portal-hint"
                  onClick={openPortal}
                >
                  <span>⏎</span>
                  Step inside the live product
                </button>
              </div>
              <div className="pitch-sheet">
                <div className="pitch-sheet__caption">
                  <span>First screen</span>
                  <strong>The risk is visible</strong>
                </div>
                <div className="pitch-sheet__window">
                  <GatingHero requirements={requirements} />
                </div>
                {sourceProofReq && (
                  <div
                    className={`pitch-source-peek ${
                      sourcePeekOpen ? "is-open" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="pitch-source-peek__trigger"
                      aria-expanded={sourcePeekOpen}
                      onClick={() => setSourcePeekOpen((open) => !open)}
                    >
                      <span>Source proof</span>
                      <strong>
                        {sourceProofReq.source_clause ?? "Tender source"} · p.
                        {sourceProofReq.source_page}
                      </strong>
                    </button>
                    <div className="pitch-source-peek__panel">
                      <p>{sourceProofReq.source_excerpt}</p>
                      <span>
                        {sourceProofReq.source_rect_match === "exact"
                          ? "Exact source match"
                          : sourceProofReq.source_rect_match === "approx"
                            ? "Approximate source match"
                            : "Text source attached"}
                      </span>
                    </div>
                  </div>
                )}
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
          glyph: "seal",
          notes: [
            "Close with the thesis: 10× faster, expert at the wheel.",
            `Say it in full: ${CTA}`,
            "Primary CTA is bidframe.org. Secondary CTA is bidframe.org/demo.",
            "Pressing NEXT here cuts straight to /showcase for Joel's demo. Appendix stays on Q.",
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
          glyph: "seal",
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
          glyph: "seal",
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
                  tick={activeIndex === 6}
                />
                <Metric
                  label="Deal-breaker detector"
                  count={dealBreakers.length}
                  suffix="rows surfaced"
                  tick={activeIndex === 6}
                />
                <Metric
                  label="Answer receipts"
                  count={backedCount}
                  suffix="backed drafts"
                  tick={activeIndex === 6}
                />
                <Metric
                  label="Human gaps"
                  count={openQuestionCount}
                  suffix="open prompts"
                  tick={activeIndex === 6}
                />
                <Metric label="Scope" value="pre-baked real run" />
              </div>
              <div className="pitch-field-note-grid">
                <div>
                  <span>Deal-breaker benchmark</span>
                  <strong>12/12</strong>
                  <p>SPSO plus museum disqualifiers caught in validated gold.</p>
                </div>
                <div>
                  <span>Held-out check</span>
                  <strong>10/10</strong>
                  <p>Bradwell deal-breakers caught outside the hero tender.</p>
                </div>
                <div>
                  <span>Phrasing bank</span>
                  <strong>101/101</strong>
                  <p>Worst-case wording variants caught by the safety net.</p>
                </div>
                <div>
                  <span>Still honest</span>
                  <strong>No headline precision</strong>
                  <p>Broader requirement recall needs a larger benchmark.</p>
                </div>
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
          glyph: "seal",
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
          glyph: "seal",
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
                  /pitch and /demo use cached Bradwell output from a real
                  pipeline run. The live route remains available after the pitch.
                </p>
              </div>
              <div className="pitch-reliability-list">
                <span>Primary pitch: /pitch (portal opens the product in-stage)</span>
                <span>Live walkthrough: /showcase (Joel&apos;s 2-minute demo)</span>
                <span>Guided backup: /demo · Answer workspace: /answers</span>
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
          glyph: "seal",
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
        {
          bucket: "Appendix",
          title: "Architecture",
          speaker: "Q&A",
          zone: "paper",
          light: 0.85,
          glyph: "graph",
          notes: [
            "Use this if asked how it works under the hood.",
            "Say it in full: it creates structured records — extracted requirements, conservative reconciliation, source citations and answer receipts.",
            "Contrast with a PDF chatbot without naming competitors. Bidframe produces a structured review layer.",
            "Point at the graph as traceability and dependency structure.",
          ],
          body: (
            <div className="pitch-spread">
              <div className="pitch-copy">
                <p className="pitch-kicker">Architecture</p>
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
      ] satisfies Array<SlideMeta & { body: React.ReactNode }>,
    [
      activeIndex,
      beat,
      backedCount,
      dealBreakers,
      openPortal,
      openQuestionCount,
      requirements,
      sourcePeekOpen,
      sourceProofReq,
      splitDealBreakers,
      title,
    ]
  );

  const activeSlide = slides[activeIndex];
  const inAppendix = activeIndex >= MAIN_SLIDE_COUNT;
  const trailLabels = useMemo(
    () => slides.slice(0, MAIN_SLIDE_COUNT).map((slide) => slide.bucket),
    [slides]
  );

  // Pace ghost: where the clock stands against the rehearsed slide budget.
  // Positive = running behind; negative = ahead. Only meaningful on the trail.
  const paceDelta =
    elapsedSeconds - PACE_STARTS[Math.min(activeIndex, MAIN_SLIDE_COUNT - 1)];

  // The handoff cue: who takes over after this slide. An explicit override
  // (Joel's live demo) wins; otherwise derive from the next slide's speaker.
  const nextMainSlide =
    activeIndex + 1 < MAIN_SLIDE_COUNT ? slides[activeIndex + 1] : null;
  const handoffTo =
    activeSlide.nextUp ??
    (nextMainSlide && nextMainSlide.speaker !== activeSlide.speaker
      ? nextMainSlide.speaker
      : null);

  const slideBudget = inAppendix ? null : AUTOPLAY_SECONDS[activeIndex];
  const rehearsalRemaining =
    slideBudget === null ? null : Math.max(0, slideBudget - slideSeconds);

  return (
    <main className="pitch-scope">
      <div className="pitch-shell">
        <div
          className={`pitch-stage ${cursorHidden ? "is-cursor-hidden" : ""}`}
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
            <TenderGlyph stage={activeSlide.glyph} />
            <span>{TENDER_STAGE_LABELS[activeSlide.glyph]}</span>
          </div>

          <TrailMap
            labels={trailLabels}
            activeIndex={activeIndex}
            offTrail={inAppendix}
            onSelect={goTo}
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
            <div
              className="pitch-timer"
              aria-label={`Elapsed time ${formatElapsed(elapsedSeconds)}`}
            >
              <span>Time</span>
              <strong>
                {formatElapsed(elapsedSeconds)}
                {!inAppendix && elapsedSeconds > 0 && (
                  <em
                    className={`pitch-pace ${
                      paceDelta > 5 ? "pitch-pace--over" : ""
                    }`}
                    aria-label={`${Math.abs(paceDelta)} seconds ${
                      paceDelta >= 0 ? "behind" : "ahead of"
                    } the rehearsed pace`}
                  >
                    {paceDelta >= 0 ? "+" : "−"}
                    {Math.abs(paceDelta)}s
                  </em>
                )}
              </strong>
            </div>
            {handoffTo && !inAppendix && (
              <div className="pitch-handoff" aria-label={`Next up ${handoffTo}`}>
                <span>next</span>
                <strong>{handoffTo}</strong>
              </div>
            )}
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
              onClick={toggleRehearsal}
              aria-pressed={rehearsal}
              aria-label={rehearsal ? "Stop rehearsal mode" : "Start rehearsal mode"}
              className={rehearsal ? "is-active" : ""}
            >
              <span aria-hidden="true">R</span>
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
            >
              <IconFullscreen />
            </button>
          </div>

          {helpOpen && (
            <aside
              className="pitch-help no-print"
              onClick={() => setHelpOpen(false)}
            >
              <p>Shortcuts</p>
              <ul>
                <li>
                  <kbd>→</kbd> / <kbd>Space</kbd> next · <kbd>←</kbd> back
                </li>
                <li>
                  <kbd>1</kbd>–<kbd>5</kbd> jump to slide · <kbd>Q</kbd> field
                  notes
                </li>
                <li>
                  <kbd>P</kbd> step inside the product · <kbd>Esc</kbd> walk
                  back
                </li>
                <li>
                  <kbd>A</kbd> autoplay · <kbd>R</kbd> rehearsal ·{" "}
                  <kbd>N</kbd> notes · <kbd>F</kbd> fullscreen
                </li>
                <li>
                  <kbd>?</kbd> toggle this card · <kbd>Esc</kbd> close
                </li>
                <li>
                  <kbd>Home</kbd> restart timer · <kbd>End</kbd> jump to ask
                </li>
              </ul>
            </aside>
          )}

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

          {/* Rehearsal HUD: who's on, how long they have left on this slide,
              and who takes over — big enough to read from across the room. */}
          {rehearsal && !inAppendix && !portalOpen && (
            <aside className="pitch-rehearsal no-print" aria-hidden="true">
              <span>{activeSlide.speaker}</span>
              {rehearsalRemaining !== null && (
                <strong
                  className={rehearsalRemaining <= 5 ? "is-closing" : ""}
                >
                  {rehearsalRemaining}s
                </strong>
              )}
              {handoffTo && <em>next · {handoffTo}</em>}
            </aside>
          )}

          {/* Walk into the product: the real MatrixView over the frozen
              Bradwell run, inside the stage. Esc returns to the deck. */}
          {portalOpen && (
            <div className="pitch-portal no-print">
              <div className="pitch-portal__chrome">
                <span>Live product · frozen Bradwell run</span>
                <button type="button" onClick={() => setPortalOpen(false)}>
                  Esc · Back to the deck
                </button>
              </div>
              <div className="pitch-portal__body">
                <MatrixView title={title} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
