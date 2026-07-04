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
import { ComplianceMatrix } from "@/components/ComplianceMatrix";
import { GatingHero } from "@/components/GatingHero";
import { MatrixView } from "@/components/MatrixView";
import {
  AnswerCard as AnswerCardShot,
  ClauseCard,
  DealBreakerCard,
} from "@/components/landing/ProductShots";
import { useRequirements } from "@/context/RequirementsContext";
import { deriveTriage } from "@/lib/triage";

// The 5-minute show (J-089 split): six deck slides, Bobby + Jawad on the
// deck, Joel + Pranav on the live /showcase walkthrough. The Competitors
// slide (s5) hands the stage to /showcase; right arrow there returns to
// the Ask (s6) for the close.
const MAIN_SLIDE_COUNT = 6;
const TOTAL_SLIDE_COUNT = MAIN_SLIDE_COUNT;
// The Product slide: where the walk-into-the-product portal opens.
const PRODUCT_INDEX = 3;
// Beats per main slide: NEXT walks a slide's internal beats before moving on.
// Use Case paces four register stations (each swaps in a product proof);
// the stop-sign and the competitor register keep their two-beat reveals.
const SLIDE_BEATS = [1, 4, 2, 1, 2, 1] as const;

function beatsAt(index: number) {
  return SLIDE_BEATS[index] ?? 1;
}

// The manual process, stuck to the tender page at beat 0: the scraps a bid
// manager actually juggles. Grounded in the Bradwell pack (insurance limits,
// pricing statements, the Glovers Lane deadline) — swept away on reveal.
const CHAOS_NOTES = [
  "34 pages — third read-through",
  "reqs_tracker_v12_FINAL(2).xlsx",
  "£5m PL or £10m EL — which goes where?",
  "did legal see clause 4.6?",
  "pricing statement… p.31?!",
  "hard copy to Glovers Lane by Thu 17:00",
  "one missed clause = binned bid",
] as const;

const PITCH_REEL_PAGES = [
  "before-tender-p7.png",
  "before-tender-p31.png",
] as const;

const PDF_REEL_FRAME_STYLE = {
  "--tilt-x": "2deg",
  "--tilt-y": "-4deg",
  "--plane-z": "-34px",
  position: "relative",
  width: "min(56rem, 86vw)",
  height: "clamp(11rem, 48vh, 22rem)",
  overflow: "hidden",
  border: "1px solid rgba(246, 242, 233, 0.2)",
  background: "rgba(6, 18, 11, 0.72)",
  boxShadow: "0 28px 68px rgba(0, 0, 0, 0.46)",
} as React.CSSProperties;

const PDF_REEL_SHADE_STYLE = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "linear-gradient(180deg, rgba(6, 18, 11, 0.08), rgba(6, 18, 11, 0.32)), radial-gradient(circle at center, transparent 46%, rgba(6, 18, 11, 0.45))",
} as React.CSSProperties;

// Deck talk: 25/30/40/45/25/30 = 195s. The ~1:45 /showcase walkthrough sits
// between the Competitors slide and the Ask, outside this clock (5:00 show).
const AUTOPLAY_SECONDS = [25, 30, 40, 45, 25, 30] as const;
// Where the clock *should* be when each main slide starts (pace ghost).
const PACE_STARTS = AUTOPLAY_SECONDS.map((_, i) =>
  AUTOPLAY_SECONDS.slice(0, i).reduce((sum, s) => sum + s, 0)
);
// v5: six main slides — the Competitors register sits before the Ask.
const PITCH_STATE_KEY = "bidframe.pitch.state.v5";
const ASK_SLIDE_INDEX = MAIN_SLIDE_COUNT - 1;
const SHOWCASE_HANDOFF_SLIDE_INDEX = ASK_SLIDE_INDEX - 1;
const PITCH_RETURN_HREF = `/pitch#${ASK_SLIDE_INDEX + 1}`;
const SHOWCASE_HANDOFF_HREF = `/showcase?returnTo=${encodeURIComponent(
  PITCH_RETURN_HREF
)}`;

// The competitor register (s5): four axes, four camps, glyphs only — the
// spoken script carries the detail (bobbyscript.md). Marks are shapes, not
// colour alone (greyscale-safe).
type RegisterMark = "yes" | "part" | "no";

const REGISTER_AXES = [
  "Source-linked",
  "Deal-breaker catch",
  "Decision record",
  "SME price",
] as const;

const REGISTER_GLYPHS: Record<RegisterMark, string> = {
  yes: "✓",
  part: "~",
  no: "✗",
};

const REGISTER_ROWS: Array<{
  name: string;
  detail: string;
  us?: boolean;
  cells: RegisterMark[];
}> = [
  {
    name: "Bidframe",
    detail: "",
    us: true,
    cells: ["yes", "yes", "yes", "yes"],
  },
  {
    name: "AI bid writers",
    detail: "AutogenAI · mytender.io",
    cells: ["part", "no", "no", "no"],
  },
  {
    name: "Answer libraries",
    detail: "Loopio · Responsive",
    cells: ["no", "no", "part", "no"],
  },
  {
    name: "PDF chat",
    detail: "NotebookLM · ChatGPT",
    cells: ["no", "no", "no", "part"],
  },
];

interface PitchStoredState {
  activeIndex: number;
  beat: number;
  elapsedSeconds: number;
}

interface SlideMeta {
  bucket: string;
  title: string;
  speaker: string;
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
  // Client-side hops between /pitch and /showcase can stack fragments
  // ("#5#6" seen in the wild) — the last segment is the intended slide.
  const cleaned = (hash.split("#").filter(Boolean).pop() ?? "")
    .trim()
    .toLowerCase();
  if (!cleaned) return null;

  const slideMatch = /^(?:slide-)?(\d+)$/.exec(cleaned);
  if (!slideMatch) return null;

  const index = Number(slideMatch[1]) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= TOTAL_SLIDE_COUNT) {
    return null;
  }
  return index;
}

function hashForIndex(index: number) {
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
    const index = clampSlideIndex(activeIndex);
    return {
      activeIndex: index,
      beat:
        typeof parsed.beat === "number" && Number.isInteger(parsed.beat)
          ? Math.min(Math.max(parsed.beat, 0), beatsAt(index) - 1)
          : 0,
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

function PitchPdfReel() {
  return (
    <div className="pitch-before-after__reel" aria-hidden="true">
      <div className="pitch-before-after__reel-track">
        {[0, 1].map((half) => (
          <div className="pitch-before-after__reel-half" key={half}>
            {PITCH_REEL_PAGES.map((page) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={page} src={`/pitch/${page}`} alt="" />
            ))}
          </div>
        ))}
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
  // The product slide's back plane: a dimmed, decorative compact matrix.
  // Rows are capped because every slide stays mounted for the whole pitch.
  const exhibitGroups = useMemo(
    () =>
      deriveTriage(requirements).groups.map((group) => ({
        ...group,
        items: group.items.slice(0, 6),
      })),
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
  const next = useCallback(() => {
    setAutoplay(false);
    // Walk this slide's internal beats before leaving it.
    if (beat < beatsAt(activeIndex) - 1) {
      setBeat(beat + 1);
      return;
    }
    // The live walkthrough sits between Competitors and the final Ask. The
    // Competitors slide hands the stage to /showcase, which returns to the
    // Ask hash for the close.
    if (activeIndex === SHOWCASE_HANDOFF_SLIDE_INDEX) {
      router.push(SHOWCASE_HANDOFF_HREF);
      return;
    }
    setBeat(0);
    setSlideSeconds(0);
    setActiveIndex((current) => Math.min(current + 1, TOTAL_SLIDE_COUNT - 1));
  }, [activeIndex, beat, router]);

  const previous = useCallback(() => {
    setAutoplay(false);
    if (beat > 0) {
      setBeat(beat - 1);
      return;
    }
    const target = Math.max(activeIndex - 1, 0);
    // walking backwards re-enters a beated slide already resolved
    setBeat(beatsAt(target) - 1);
    setSlideSeconds(0);
    setActiveIndex(target);
  }, [activeIndex, beat]);

  // Direct jumps (trail map, number keys) land on the finished state.
  const goTo = useCallback((index: number) => {
    setAutoplay(false);
    const target = clampSlideIndex(index);
    setBeat(beatsAt(target) - 1);
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
  }, []);

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
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key >= "1" && event.key <= "6") {
        event.preventDefault();
        goTo(Number(event.key) - 1);
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
      // Deep links land on a slide's finished state; stored state resumes
      // mid-beat exactly where the presenter left off.
      const restoredBeat =
        hashIndex !== null
          ? beatsAt(clampSlideIndex(targetIndex)) - 1
          : stored?.beat ?? 0;

      setActiveIndex(clampSlideIndex(targetIndex));
      setBeat(restoredBeat);
      setElapsedSeconds(stored?.elapsedSeconds ?? 0);
      setRestored(true);
    });

    return () => window.cancelAnimationFrame(restoreFrame);
  }, []);

  // Follow hash changes after mount — the /showcase return lands on /pitch#6
  // whether the deck remounts or Next reuses the mounted page.
  useEffect(() => {
    function onHashChange() {
      const index = parsePitchHash(window.location.hash);
      if (index !== null) goTo(index);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [goTo]);

  useEffect(() => {
    if (!restored) return;
    const state: PitchStoredState = {
      activeIndex,
      beat,
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
  }, [activeIndex, beat, elapsedSeconds, restored]);

  // The Competitors slide's NEXT press cuts to the live demo — have /showcase ready.
  useEffect(() => {
    router.prefetch(SHOWCASE_HANDOFF_HREF);
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

    // Autoplay walks a slide's beats evenly across its budget.
    const beats = beatsAt(activeIndex);
    const budgetMs = AUTOPLAY_SECONDS[activeIndex] * 1000;
    const beatTimeouts = Array.from({ length: beats - 1 }, (_, k) =>
      window.setTimeout(() => setBeat(k + 1), ((k + 1) * budgetMs) / beats)
    );

    const timeout = window.setTimeout(() => {
      if (activeIndex === SHOWCASE_HANDOFF_SLIDE_INDEX) {
        setAutoplay(false);
        router.push(SHOWCASE_HANDOFF_HREF);
      } else if (activeIndex === MAIN_SLIDE_COUNT - 1) {
        setAutoplay(false);
      } else {
        setBeat(0);
        setSlideSeconds(0);
        setActiveIndex((current) => Math.min(current + 1, MAIN_SLIDE_COUNT - 1));
      }
    }, budgetMs);

    return () => {
      beatTimeouts.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(timeout);
    };
  }, [activeIndex, autoplay, router]);

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
          body: (
            <div className="pitch-poster pitch-poster--center">
              <h1>One missed deal&#8209;breaker kills the bid</h1>
            </div>
          ),
        },
        {
          bucket: "Use Case",
          title: "The bid manager's first read",
          speaker: "Jawad",
          zone: "pine",
          light: 0.3,
          glyph: "read",
          body: (
            <div className="pitch-journey">
              <div className="pitch-journey__head">
                <h2>The first read decides what happens next</h2>
              </div>
              <TrailSteps
                active={activeIndex === 1 ? beat : 3}
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
              <div className="pitch-journey__exhibit pitch-exhibit">
                {(activeIndex === 1 ? beat : 3) === 0 ? (
                  <div
                    className="pitch-journey__pdf-reel pitch-exhibit__plane"
                    role="img"
                    aria-label="Scrolling preview of the Bradwell tender PDF"
                    style={PDF_REEL_FRAME_STYLE}
                  >
                    <PitchPdfReel />
                    <span aria-hidden="true" style={PDF_REEL_SHADE_STYLE} />
                  </div>
                ) : (
                  <div
                    key={activeIndex === 1 ? beat : 3}
                    className="pitch-journey__proof pitch-exhibit__plane"
                    style={
                      {
                        "--tilt-y":
                          (activeIndex === 1 ? beat : 3) % 2 ? "-5deg" : "5deg",
                        "--plane-z": "-30px",
                      } as React.CSSProperties
                    }
                  >
                    {(activeIndex === 1 ? beat : 3) === 1 ? (
                      <DealBreakerCard />
                    ) : (activeIndex === 1 ? beat : 3) === 2 ? (
                      <ClauseCard />
                    ) : (
                      <AnswerCardShot />
                    )}
                  </div>
                )}
              </div>
            </div>
          ),
        },
        {
          bucket: "Solution",
          title: "The tender becomes a deal-breaker view",
          speaker: "Bobby",
          zone: "night",
          light: 0.12,
          glyph: "clause",
          body: (
            <div
              className={`pitch-before-after ${
                beat > 0 ? "is-revealed" : ""
              }`}
            >
              <div className="pitch-before-after__copy">
                <h2>One clause. Five ways to lose the bid.</h2>
                <p className="pitch-before-after__contrast">
                  <span className="pitch-before-after__contrast-line pitch-before-after__contrast-line--before">
                    A full day of reading. Miss one, the bid is binned.
                  </span>
                  <span className="pitch-before-after__contrast-line pitch-before-after__contrast-line--after">
                    Weeks of expert work, one miss = a binned bid&ensp;→&ensp;
                    minutes, every deal-breaker caught, every line traceable.
                  </span>
                </p>
              </div>
              <div className="pitch-before-after__stage">
                <figure
                  className="pitch-before-after__panel pitch-before-after__panel--before pitch-exhibit__plane"
                  style={
                    {
                      "--tilt-x": "3deg",
                      "--tilt-y": "-6deg",
                    } as React.CSSProperties
                  }
                >
                  <figcaption className="pitch-before-after__label">
                    <span>The tender. 34 pages.</span>
                  </figcaption>
                  <div className="pitch-before-after__document pitch-before-after__document--layered">
                    {/* An endless scroll of real scanned Bradwell pages holds
                        beat 0 — the sheer length is the pain. On reveal the
                        facsimile resolves over it with the disqualifiers
                        marked, crisp instead of pixel-guessed onto the scan.
                        Two identical halves make the loop seamless. */}
                    <PitchPdfReel />
                    <div className="pitch-before-after__scan" aria-hidden="true" />
                    {/* The manual-process chaos stuck to the page at beat 0 —
                        swept away with the scan when Bidframe takes over. */}
                    <ul className="pitch-before-after__chaos" aria-hidden="true">
                      {CHAOS_NOTES.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                    <TenderPageFacsimile highlighted={beat > 0} />
                  </div>
                </figure>
                <section
                  className="pitch-before-after__panel pitch-before-after__panel--after"
                  aria-hidden={beat === 0 ? true : undefined}
                >
                  <div className="pitch-before-after__label">
                    <span>Bidframe. Deal-breakers first. Every line back to its clause.</span>
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
                </section>
              </div>
            </div>
          ),
        },
        {
          bucket: "Product",
          title: "Deal-breakers first. Every line checkable.",
          speaker: "Bobby",
          zone: "moss",
          light: 0.6,
          glyph: "matrix",
          body: (
            <div className="pitch-spread">
              <div className="pitch-copy">
                <h2>The tender, mapped.</h2>
                <p>Every line shows where it came from.</p>
                <div className="pitch-mini-metrics">
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
              <div className="pitch-sheet-stack pitch-exhibit">
                <div
                  className="pitch-sheet-stack__matrix pitch-exhibit__plane"
                  aria-hidden="true"
                  style={
                    {
                      "--tilt-y": "6deg",
                      "--plane-z": "-140px",
                      "--plane-dim": "0.4",
                      "--plane-scale": "0.92",
                    } as React.CSSProperties
                  }
                >
                  <ComplianceMatrix
                    groups={exhibitGroups}
                    selectedId={null}
                    onSelect={() => {}}
                    onApprove={() => {}}
                    activeFilter={null}
                    density="compact"
                  />
                </div>
                <div
                  className="pitch-sheet pitch-exhibit__plane"
                  style={
                    {
                      "--tilt-x": "2deg",
                      "--tilt-y": "-5deg",
                      "--plane-delay": "80ms",
                    } as React.CSSProperties
                  }
                >
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
            </div>
          ),
        },
        {
          bucket: "Competitors",
          title: "Competitor analysis",
          speaker: "Bobby",
          zone: "moss",
          light: 0.75,
          glyph: "matrix",
          nextUp: "Joe + Pranav · demo",
          body: (
            <div className={`pitch-register ${beat > 0 ? "is-revealed" : ""}`}>
              <div className="pitch-copy pitch-register__copy">
                <h2>Competitor analysis</h2>
              </div>
              <div className="pitch-register__sheet">
                <table className="pitch-register__table">
                  <thead>
                    <tr>
                      <th scope="col">
                        <span className="sr-only">Tool</span>
                      </th>
                      {REGISTER_AXES.map((axis) => (
                        <th key={axis} scope="col">
                          {axis}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {REGISTER_ROWS.map((row) => (
                      <tr
                        key={row.name}
                        className={
                          row.us
                            ? "pitch-register__row--us"
                            : "pitch-register__row--them"
                        }
                      >
                        <th scope="row">
                          <strong>{row.name}</strong>
                          {row.detail && <em>{row.detail}</em>}
                        </th>
                        {row.cells.map((mark, cellIndex) => (
                          <td key={REGISTER_AXES[cellIndex]} data-mark={mark}>
                            <span aria-hidden="true">
                              {REGISTER_GLYPHS[mark]}
                            </span>
                            <span className="sr-only">{mark}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="pitch-register__price">
                  Incumbents: enterprise-priced, demo-gated. Bidframe: the
                  first read an SME can afford.
                </p>
                <p className="pitch-register__source">
                  Competitor cells: their published positioning, 4 Jul 2026 ·
                  Bidframe: measured (claim ledger)
                </p>
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
          body: (
            <div className="pitch-poster pitch-poster--center">
              <h2>Help us scale the first&#8209;read layer</h2>
              <div className="pitch-cta-row">
                <a href="https://bidframe.org">bidframe.org</a>
                <Link href="/demo">Help us scale</Link>
              </div>
            </div>
          ),
        },
      ] satisfies Array<SlideMeta & { body: React.ReactNode }>,
    [
      activeIndex,
      beat,
      dealBreakers,
      exhibitGroups,
      openPortal,
      requirements,
      sourcePeekOpen,
      sourceProofReq,
      splitDealBreakers,
    ]
  );

  const activeSlide = slides[activeIndex];
  const trailLabels = useMemo(
    () => slides.map((slide) => slide.bucket),
    [slides]
  );

  // Pace ghost: where the clock stands against the rehearsed slide budget.
  // Positive = running behind; negative = ahead.
  const paceDelta = elapsedSeconds - PACE_STARTS[activeIndex];

  // The handoff cue: who takes over after this slide. An explicit override
  // (Joel's live demo) wins; otherwise derive from the next slide's speaker.
  const nextMainSlide =
    activeIndex + 1 < MAIN_SLIDE_COUNT ? slides[activeIndex + 1] : null;
  const handoffTo =
    activeSlide.nextUp ??
    (nextMainSlide && nextMainSlide.speaker !== activeSlide.speaker
      ? nextMainSlide.speaker
      : null);

  const slideBudget = AUTOPLAY_SECONDS[activeIndex] ?? null;
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
          <style>{`
            .pitch-scope .pitch-stage::after {
              background:
                radial-gradient(ellipse at 50% 48%, transparent 0%, transparent 55%, rgba(6, 18, 11, 0.18) 100%),
                radial-gradient(circle at 22% 18%, rgba(246, 242, 233, 0.13), transparent 34%),
                radial-gradient(circle at 78% 86%, rgba(17, 26, 19, 0.16), transparent 36%);
              background-size: 100% 100%, 100% 100%, 100% 100%;
            }

            .pitch-scope .pitch-story {
              display: none !important;
            }
          `}</style>

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
              </div>
              <div className="pitch-slide-body">{slide.body}</div>
            </section>
          ))}

          {/* the story object: one tender page carried through the walk */}
          <div
            className={`pitch-story no-print ${
              zoneIsDark(activeSlide.zone) ? "" : "pitch-story--ink"
            }`}
            aria-hidden="true"
          >
            <TenderGlyph stage={activeSlide.glyph} />
            <span>{TENDER_STAGE_LABELS[activeSlide.glyph]}</span>
          </div>

          <TrailMap
            labels={trailLabels}
            activeIndex={activeIndex}
            offTrail={false}
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
              <strong>{`${activeIndex + 1} / ${MAIN_SLIDE_COUNT}`}</strong>
              {beatsAt(activeIndex) > 1 && (
                <span className="pitch-counter__beats" aria-hidden="true">
                  {Array.from({ length: beatsAt(activeIndex) }, (_, i) => (
                    <i key={i} className={i <= beat ? "is-done" : ""} />
                  ))}
                </span>
              )}
            </div>
            <div
              className="pitch-timer"
              aria-label={`Elapsed time ${formatElapsed(elapsedSeconds)}`}
            >
              <span>Time</span>
              <strong>
                {formatElapsed(elapsedSeconds)}
                {elapsedSeconds > 0 && (
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
            {handoffTo && (
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
                  <kbd>1</kbd>–<kbd>6</kbd> jump to slide
                </li>
                <li>
                  <kbd>P</kbd> step inside the product · <kbd>Esc</kbd> walk
                  back
                </li>
                <li>
                  <kbd>A</kbd> autoplay · <kbd>R</kbd> rehearsal ·{" "}
                  <kbd>F</kbd> fullscreen
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

          {/* Rehearsal HUD: who's on, how long they have left on this slide,
              and who takes over — big enough to read from across the room. */}
          {rehearsal && !portalOpen && (
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
