// The script for the /demo cinematic scroll. Each step is one narrative beat
// (a mono kicker + a Fraunces heading + one or two honest sentences) paired with
// one stage state. Content and rendering are kept apart: this array drives the
// narrative column, and <ScrollyStage step={i} /> switches the pinned visual on
// the index. British English, provisional and honest (no hype, confidence never
// a number). Beats follow demo-scrolly-design-pack.md section 7.

export type StageKey =
  | "wall"
  | "rows"
  | "dealbreaker"
  | "honesty"
  | "answer"
  | "approval"
  | "graph";

export type Step = {
  id: string;
  kicker: string;
  heading: string;
  body: string;
  stage: StageKey;
};

export const STEPS: Step[] = [
  {
    id: "problem",
    kicker: "The problem",
    heading: "A hundred pages, read by hand",
    body: "A bid writer spends weeks reading a public tender. The one line that voids the whole bid looks like every other line on the page.",
    stage: "wall",
  },
  {
    id: "extraction",
    kicker: "Extraction",
    heading: "Bidframe reads the whole thing",
    body: "Every requirement is pulled out with its clause and page, so nothing is lost at a page break and nothing is read twice.",
    stage: "rows",
  },
  {
    id: "catch",
    kicker: "The catch",
    heading: "The deal-breaker, first",
    body: "Public tenders have hard pass or fail gates. Bidframe lifts them to the top, so you see the bid-killer before anything else.",
    stage: "dealbreaker",
  },
  {
    id: "honesty",
    kicker: "Honesty",
    heading: "It tells you when it isn't sure",
    body: "Where it is unsure it says so and flags the line for you, instead of dressing a guess up as a finished answer.",
    stage: "honesty",
  },
  {
    id: "autofill",
    kicker: "Autofill",
    heading: "Answers, with receipts",
    body: "It drafts each answer from your own documents, and shows exactly which one it came from, down to the page.",
    stage: "answer",
  },
  {
    id: "control",
    kicker: "Control",
    heading: "You approve every line",
    body: "You approve, edit, or flag each one. Nothing goes into the bid that you did not sign off yourself.",
    stage: "approval",
  },
  {
    id: "map",
    kicker: "The map",
    heading: "How the requirements connect",
    body: "Each requirement links to the award criterion that scores it and to the ones it depends on, so you see where the marks live.",
    stage: "graph",
  },
];
