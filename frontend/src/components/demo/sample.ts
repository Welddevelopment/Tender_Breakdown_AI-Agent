import type { Requirement } from "@/types/requirement";

// Curated, scripted data for the /demo cinematic scroll (the pinned "stage").
// The scrollytelling story is choreographed, not live, so it runs on a small,
// hand-picked set from the same frozen Bradwell tender that the hands-on section
// uses. Five requirements chosen so each beat lands cleanly, and carrying
// varied categories plus all four confidence tiers:
//   - THREE gating deal-breakers (SAMPLE_GATING) compose the real GatingHero,
//   - the flagged, needs_review row drops to the oxblood "can't answer this"
//     alarm in the honesty beat, with amber, yellow and confident rows around it,
//   - the insurance gate carries a grounded answer + evidence receipt.
// Shaped to the real Requirement type so the visuals reuse the real components.

export const SAMPLE: Requirement[] = [
  {
    id: "s-insurance-gate",
    text: "The tenderer must hold Public Liability insurance of at least £5,000,000 and Employers Liability insurance of at least £10,000,000.",
    source_page: 5,
    source_clause: "3.3.2",
    source_excerpt:
      "Public Liability minimum £5,000,000. Employers Liability minimum £10,000,000.",
    type: "mandatory",
    is_gating: true,
    category: "insurance",
    confidence: 0.96,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-1",
    depends_on: [],
    draft_answer:
      "AcmeGrounds Ltd holds Public Liability insurance of £5,000,000 and Employers Liability insurance of £10,000,000.",
    answer: {
      text: "AcmeGrounds Ltd meets this requirement. We hold Public Liability insurance of £5,000,000 and Employers Liability insurance of £10,000,000, both current.",
      state: "auto",
      evidence_refs: [
        {
          doc_id: "cap-002-insurance-certificates",
          excerpt:
            "Public Liability: £5,000,000. Employers Liability: £10,000,000. Insurer: Aviva. Renewal date: 01/04/2026.",
          page: 1,
        },
      ],
      confidence: 0.93,
    },
    open_questions: [],
    // Collaboration counts (Stage 6) for the /demo collaboration beat: two team
    // comments, one of them an unresolved blocker — the same requirement the
    // answer/approval beats already centre on, so the thread reads as a
    // continuation of one decision rather than a new example.
    comment_count: 2,
    open_blocker_count: 1,
  },
  {
    id: "s-auto-disqual",
    text: "Any tenderer who cannot guarantee delivery of the Mandatory Requirements and/or the specification will automatically be disqualified from further evaluation.",
    source_page: 5,
    source_clause: "3.2",
    source_excerpt:
      "Any tenderer who cannot guarantee delivery of the Mandatory Requirements and/or the specification will automatically be disqualified from further evaluation.",
    type: "mandatory",
    is_gating: true,
    category: "eligibility",
    confidence: 0.94,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-1",
    depends_on: [],
    draft_answer: null,
    answer: {
      text: "",
      state: "empty",
      evidence_refs: [],
      confidence: 0,
    },
    open_questions: [],
  },
  {
    id: "s-pricing-statements",
    text: "Tenderers must read and confirm the four mandatory pricing statements before submitting prices; failure to confirm acceptance will remove the tenderer from consideration and their bid will not be scored.",
    source_page: 31,
    source_clause: "Response Pack 5.1",
    source_excerpt:
      "Failure to confirm acceptance of these statements will remove the Tenderer from consideration and their bid will not be scored.",
    type: "mandatory",
    is_gating: true,
    category: "pricing",
    confidence: 0.72,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-3",
    depends_on: [],
    draft_answer: null,
    answer: {
      text: "",
      state: "empty",
      evidence_refs: [],
      confidence: 0,
    },
    open_questions: [],
  },
  {
    id: "s-references",
    text: "Tenderers must provide two comparable contracts (grounds maintenance) with client contact details as references.",
    source_page: 28,
    source_clause: "Response Pack 3",
    source_excerpt:
      "Tenderers must provide two comparable contracts (grounds maintenance) with client contact details as references.",
    type: "mandatory",
    is_gating: false,
    category: "experience",
    confidence: 0.34,
    status: "pending",
    needs_review: true,
    decision: null,
    criteria_ref: "award-criterion-2",
    depends_on: [],
    draft_answer: null,
    answer: {
      text: "",
      state: "needs_input",
      evidence_refs: [],
      confidence: 0.3,
    },
    open_questions: [
      {
        id: "q-references-1",
        question:
          "Which two comparable public-sector grounds-maintenance contracts should we cite as references, and who is the client contact at each?",
        answer: null,
        answered_at: null,
      },
    ],
  },
  {
    id: "s-waste-licence",
    text: "Tenderers must hold a valid waste carrier licence for the removal of grass arisings and green waste.",
    source_page: 12,
    source_clause: "Spec 6.4",
    source_excerpt:
      "The Contractor shall remove grass arisings and green waste from site and must hold a valid waste carrier licence.",
    type: "mandatory",
    is_gating: false,
    category: "licence",
    confidence: 0.55,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-2",
    depends_on: ["s-insurance-gate"],
    draft_answer:
      "AcmeGrounds Ltd holds a valid Upper Tier waste carrier licence.",
    answer: {
      text: "AcmeGrounds Ltd holds a valid Upper Tier waste carrier licence (CBDU148820), attached.",
      state: "auto",
      evidence_refs: [
        {
          doc_id: "cap-006-waste-carrier-licence",
          excerpt:
            "Environment Agency Upper Tier Waste Carrier registration CBDU148820, valid to 2027.",
          page: 1,
        },
      ],
      confidence: 0.88,
    },
    open_questions: [],
  },
];

export const SAMPLE_EXTENDED: Requirement[] = [
  ...SAMPLE,
  {
    id: "s-deadline",
    text: "The tender must be returned by no later than 17:00hrs on Thursday 31 August to 21 Glovers Lane, Heelands, MK13 7LW.",
    source_page: 4,
    source_clause: "2.9",
    source_excerpt:
      "The tender must be returned by no later than 17:00hrs on Thursday 31 August to 21 Glovers Lane, Heelands, MK13 7LW.",
    type: "mandatory",
    is_gating: true,
    category: "submission deadline",
    confidence: 0.88,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-1",
    depends_on: [],
    draft_answer: null,
    answer: null,
    open_questions: [],
  },
  {
    id: "s-variant-bids",
    text: "No variant bids will be accepted; any bid including proposed amendments to the terms and conditions of contract is deemed a variant bid and will not be accepted.",
    source_page: 6,
    source_clause: "4.1",
    source_excerpt:
      "Any bid which includes proposed amendments to the terms and conditions of contract shall be deemed to be a variant bid and will not be accepted.",
    type: "mandatory",
    is_gating: true,
    category: "compliance",
    confidence: 0.79,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-3",
    depends_on: ["s-account"],
    draft_answer: null,
    answer: null,
    open_questions: [],
  },
  {
    id: "s-collusion",
    text: "A Tender will be rejected if the tenderer engages in collusion, offers any inducement, or commits an offence under the Bribery Act 2010.",
    source_page: 7,
    source_clause: "4.6",
    source_excerpt:
      "A Tender will be rejected if the Tenderer fixes or adjusts prices by agreement, offers an inducement, or commits an offence under the Bribery Act 2010.",
    type: "mandatory",
    is_gating: true,
    category: "integrity",
    confidence: 0.66,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-2",
    depends_on: [],
    draft_answer: null,
    answer: null,
    open_questions: [],
  },
  {
    id: "s-health-safety",
    text: "Tenderers must provide a Health & Safety policy and evidence of a safety management system.",
    source_page: 28,
    source_clause: "Response Pack 2",
    source_excerpt:
      "Tenderers must provide a Health & Safety policy and evidence of a safety management system.",
    type: "mandatory",
    is_gating: false,
    category: "health and safety",
    confidence: 0.61,
    status: "pending",
    needs_review: true,
    decision: null,
    criteria_ref: "award-criterion-2",
    depends_on: [],
    draft_answer: null,
    answer: null,
    open_questions: [],
  },
  {
    id: "s-company-profile",
    text: "Tenderers must provide a company profile describing relevant grounds-maintenance experience.",
    source_page: 28,
    source_clause: "Response Pack 1",
    source_excerpt:
      "Tenderers must provide a company profile describing relevant grounds-maintenance experience.",
    type: "mandatory",
    is_gating: false,
    category: "experience",
    confidence: 0.58,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-4",
    depends_on: [],
    draft_answer: null,
    answer: null,
    open_questions: [],
  },
  {
    id: "s-quality-score",
    text: "Unsatisfactory scores (0 to 2) for any quality criterion will result in the tender being rejected.",
    source_page: 25,
    source_clause: "Appendix C",
    source_excerpt:
      "Unsatisfactory scores for any quality criteria will result in the tender being rejected.",
    type: "mandatory",
    is_gating: true,
    category: "evaluation",
    confidence: 0.81,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-2",
    depends_on: ["s-references"],
    draft_answer: null,
    answer: null,
    open_questions: [],
  },
];

// The two deal-breakers, in the order the oxblood card lifts them out.
export const SAMPLE_GATING = SAMPLE.filter((r) => r.is_gating);

// The requirement whose grounded answer + receipt drives the autofill beats.
export const SAMPLE_ANSWERED = SAMPLE[0];

// The honest headline numbers for the demo. Truth source: the frozen Bradwell
// tender the hands-on section runs on (src/data/bradwell-prebake.json) — 34
// pages, 50 extracted requirements, 12 gating deal-breakers, 4 evidence-backed
// answers and 1 open question.
export const DEMO_FACTS = {
  pages: 34,
  requirements: 50,
  dealBreakers: 12,
  draftedAnswers: 4,
  openQuestions: 1,
  docTitle: "Bradwell Grounds Maintenance ITT",
} as const;

// One paragraph of the document wall. `lead` and `tail` are plain tender prose;
// `catch` (present on exactly ONE paragraph) is the deal-breaker sentence the
// scan lights up — kept as its own field so the stage can wrap it in the
// [data-wall-catch] span. Everything here is a module constant: deterministic
// prose, no Math.random, no dates, so SSR and client hydration always agree.
export type WallParagraph = {
  lead: string;
  catch?: string;
  tail?: string;
};

// ~8 paragraphs of British procurement boilerplate for the wall beat. Several
// reuse SAMPLE[i].source_excerpt verbatim, so the lines the register later pulls
// out are genuinely on the page the reader just squinted at. The catch sentence
// is SAMPLE[1]'s excerpt — the same automatic-disqualification clause the
// deal-breaker dossier lifts in beat 3.
export const WALL_PARAGRAPHS: WallParagraph[] = [
  {
    lead: "1.1 Introduction. Bradwell Parish Council invites tenders for the provision of grounds maintenance services across Bradwell Common and Heelands. Tenderers are advised to read this Invitation to Tender in full before preparing a response, as mandatory requirements appear throughout the document and its schedules.",
  },
  {
    lead: "2.9 Return of Tenders. Tenders must be returned in a sealed envelope to the Council office by the stated deadline. Tenderers shall ensure that all mandatory forms are completed and that supporting evidence is included against the correct response-pack reference.",
  },
  {
    lead: SAMPLE[0].source_excerpt,
    tail: "Certificates shall be provided as part of the tender response and shall name the bidding entity rather than a parent or group company.",
  },
  {
    lead: "3.2 Mandatory Requirements. The Council will first check whether the tenderer can deliver the mandatory requirements and the specification.",
    catch: SAMPLE[1].source_excerpt,
    tail: "Only tenders passing that check will move to the scored quality and price evaluation.",
  },
  {
    lead: SAMPLE[2].source_excerpt,
    tail: "Tenderers should check the pricing workbook before submission and confirm each statement before prices are entered.",
  },
  {
    lead: SAMPLE[4].source_excerpt,
    tail: "The contractor shall remove arisings from site where specified and shall dispose of waste lawfully.",
  },
  {
    lead: SAMPLE[3].source_excerpt,
    tail: "The Council may ask for clarification of references before award.",
  },
  {
    lead: "Appendix C. Tenders will be assessed against the published quality criteria and the returned price schedule. Unsatisfactory scores for any quality criterion will result in the tender being rejected, and no variant bids will be accepted.",
  },
];
