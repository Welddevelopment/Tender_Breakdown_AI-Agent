import type { Requirement } from "@/types/requirement";

// Curated, scripted data for the /demo cinematic scroll (the pinned "stage").
// The scrollytelling story is choreographed, not live, so it runs on a small,
// hand-picked set rather than the frozen SPSO tender the hands-on section uses.
// Five requirements chosen so each beat lands cleanly, and carrying VARIED
// categories (certification, compliance, experience, service) and all four
// confidence tiers so the redesigned category tags and segmented confidence
// meter are all exercised:
//   - TWO gating deal-breakers (SAMPLE_GATING) compose the real GatingHero (beat 3),
//   - the flagged, needs_review row drops to the oxblood "can't answer this" alarm
//     in the honesty beat (beat 4), with amber, yellow and confident rows around it,
//   - one requirement carries a grounded answer + evidence receipt (beats 5-6).
// Shaped to the real Requirement type so the visuals reuse the real components.

export const SAMPLE: Requirement[] = [
  {
    id: "s-iso9001",
    text: "The supplier must hold current ISO 9001 certification valid for the full contract term.",
    source_page: 14,
    source_clause: "Section 4.2.1",
    source_excerpt:
      "4.2.1 Quality Management. The supplier must hold current ISO 9001 certification valid for the full contract term. Failure to provide evidence at submission will result in automatic rejection.",
    type: "mandatory",
    is_gating: true,
    category: "certification",
    confidence: 0.96,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-1",
    depends_on: [],
    draft_answer:
      "We hold ISO 9001:2015, certified by a UKAS-accredited body and valid for the full contract term.",
    answer: {
      text: "We hold ISO 9001:2015, certified by a UKAS-accredited body and valid for the full contract term.",
      state: "auto",
      evidence_refs: [
        {
          doc_id: "cap-capability",
          excerpt:
            "Quality accreditations: ISO 9001:2015, certified by a UKAS-accredited certification body.",
          page: 4,
        },
      ],
      confidence: 0.86,
    },
    open_questions: [],
  },
  {
    id: "s-cyber",
    text: "Bidder must be Cyber Essentials Plus certified at the date of submission.",
    source_page: 22,
    source_clause: "Section 6.1.3",
    source_excerpt:
      "6.1.3 Cyber Security. Bidder must be Cyber Essentials Plus certified at the date of submission. This is a pass/fail requirement.",
    type: "mandatory",
    is_gating: true,
    category: "compliance",
    confidence: 0.94,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-1",
    depends_on: [],
    draft_answer:
      "We hold Cyber Essentials Plus, certified and valid at the date of submission.",
    answer: {
      text: "We hold Cyber Essentials Plus, certified and valid at the date of submission.",
      state: "auto",
      evidence_refs: [
        {
          doc_id: "cap-capability",
          excerpt:
            "Cyber Essentials Plus: certified (annual reassessment current); valid at submission date.",
          page: 5,
        },
      ],
      confidence: 0.82,
    },
    open_questions: [],
  },
  {
    id: "s-casestudies",
    text: "Provide at least three relevant public-sector case studies from the last five years.",
    source_page: 31,
    source_clause: "Section 8.2",
    source_excerpt:
      "8.2 Experience. Bidders shall provide at least three relevant case studies from the public sector within the last five years, demonstrating comparable scope and scale.",
    type: "mandatory",
    is_gating: false,
    category: "experience",
    confidence: 0.72,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-2",
    depends_on: ["s-iso9001"],
    draft_answer: null,
    answer: null,
    open_questions: [],
  },
  {
    id: "s-response",
    text: "Priority-one incidents acknowledged within 30 minutes, at any hour.",
    source_page: 44,
    source_clause: "Section 9.5",
    source_excerpt:
      "9.5 Service Levels. Priority-one incidents shall be acknowledged within 30 minutes, at any hour, for the duration of the contract.",
    type: "mandatory",
    is_gating: false,
    category: "service",
    confidence: 0.34,
    status: "pending",
    needs_review: true,
    decision: null,
    criteria_ref: "award-criterion-3",
    depends_on: [],
    draft_answer: null,
    answer: {
      text: "We operate a 24/7 service desk; confirming the 30-minute acknowledgement target with the delivery team.",
      state: "needs_input",
      evidence_refs: [],
      confidence: 0.45,
    },
    open_questions: [
      {
        id: "q-response-1",
        question:
          "Can you commit to a 30-minute acknowledgement for priority-one incidents at any hour?",
        answer: null,
        answered_at: null,
      },
    ],
  },
  {
    id: "s-account",
    text: "Provide a named account manager available during UK business hours.",
    source_page: 38,
    source_clause: "Section 9.4",
    source_excerpt:
      "9.4 Service Delivery. The supplier shall provide a named account manager available during UK business hours (09:00 to 17:00 GMT).",
    type: "mandatory",
    is_gating: false,
    category: "service",
    confidence: 0.55,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-2",
    depends_on: ["s-cyber"],
    draft_answer: null,
    answer: null,
    open_questions: [],
  },
];

export const SAMPLE_EXTENDED: Requirement[] = [
  ...SAMPLE,
  {
    id: "s-insurance",
    text: "Maintain public liability insurance of at least five million pounds.",
    source_page: 18,
    source_clause: "Section 5.3",
    source_excerpt:
      "5.3 Insurance. The supplier shall maintain public liability insurance of at least five million pounds for the full duration of the contract.",
    type: "mandatory",
    is_gating: false,
    category: "insurance",
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
    id: "s-tupecosts",
    text: "Include all TUPE assumptions and staff-cost risks in the pricing schedule.",
    source_page: 26,
    source_clause: "Schedule 4",
    source_excerpt:
      "Schedule 4. Tenderers must include all TUPE assumptions and staff-cost risks in the pricing schedule submitted with their tender.",
    type: "mandatory",
    is_gating: false,
    category: "pricing",
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
    id: "s-bcp",
    text: "Provide a business continuity plan covering service disruption.",
    source_page: 33,
    source_clause: "Section 8.7",
    source_excerpt:
      "8.7 Continuity. The bidder shall provide a business continuity plan covering service disruption, staff absence and emergency escalation.",
    type: "mandatory",
    is_gating: false,
    category: "compliance",
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
    id: "s-safeguarding",
    text: "Staff working on site must complete safeguarding training before mobilisation.",
    source_page: 29,
    source_clause: "Section 7.4",
    source_excerpt:
      "7.4 Staff Training. Staff working on site must complete safeguarding training before mobilisation and refresher training annually thereafter.",
    type: "mandatory",
    is_gating: false,
    category: "staffing",
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
    id: "s-carbon",
    text: "Submit a carbon reduction plan with annual reporting commitments.",
    source_page: 41,
    source_clause: "Section 10.3",
    source_excerpt:
      "10.3 Sustainability. Tenderers should submit a carbon reduction plan with annual reporting commitments for the contract term.",
    type: "optional",
    is_gating: false,
    category: "sustainability",
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
    id: "s-references",
    text: "Provide two client references for contracts of comparable size.",
    source_page: 35,
    source_clause: "Section 8.9",
    source_excerpt:
      "8.9 References. Tenderers shall provide two client references for contracts of comparable size and operational complexity.",
    type: "mandatory",
    is_gating: false,
    category: "experience",
    confidence: 0.81,
    status: "pending",
    needs_review: false,
    decision: null,
    criteria_ref: "award-criterion-2",
    depends_on: ["s-casestudies"],
    draft_answer: null,
    answer: null,
    open_questions: [],
  },
];

// The two deal-breakers, in the order the oxblood card lifts them out.
export const SAMPLE_GATING = SAMPLE.filter((r) => r.is_gating);

// The requirement whose grounded answer + receipt drives the autofill beats.
export const SAMPLE_ANSWERED = SAMPLE[0];

// The honest headline numbers for the demo. Truth source: the frozen SPSO
// tender the hands-on section runs on (src/data/spso-prebake.json) — 13 pages,
// 183 extracted requirements, 9 gating deal-breakers. The wall document and the
// register kicker quote these instead of inventing bigger ones.
export const DEMO_FACTS = {
  pages: 13,
  requirements: 183,
  dealBreakers: 9,
  docTitle: "SPSO Cleaning Services ITT",
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
// reuse SAMPLE[i].source_excerpt VERBATIM, so the lines the register later pulls
// out are genuinely on the page the reader just squinted at. The catch sentence
// is SAMPLE[1]'s excerpt (Cyber Essentials Plus, pass/fail) — the same clause
// the deal-breaker dossier lifts in beat 3.
export const WALL_PARAGRAPHS: WallParagraph[] = [
  {
    lead: "1.1 Introduction. The Authority invites tenders for the provision of cleaning services across its estate. Tenderers are advised to read this Invitation to Tender in full before preparing a response, as mandatory requirements appear throughout the document and its schedules. Failure to comply with the instructions set out herein may result in a tender being set aside without further evaluation.",
  },
  {
    lead: "2.4 Submission of Tenders. Tenders shall be submitted through the Authority's e-procurement portal in the format prescribed at Schedule 2. Late submissions will not be accepted in any circumstances. Tenderers shall ensure that all mandatory fields are completed and that supporting evidence is uploaded against the correct schedule reference.",
  },
  {
    lead: SAMPLE[0].source_excerpt,
    tail: "Certificates shall be provided as part of the tender response and shall name the bidding entity rather than a parent or group company.",
  },
  {
    lead: "3.2 Evaluation. Tenders will be evaluated against the published award criteria on the basis of the most economically advantageous tender. Where a response fails a pass or fail question, the tender as a whole will be excluded from further consideration regardless of the marks achieved elsewhere in the evaluation.",
  },
  {
    lead: "6.1 Information Security. The supplier shall comply with the Authority's information security policies as amended from time to time, and shall notify the Authority without undue delay of any actual or suspected security incident affecting the services.",
    catch: SAMPLE[1].source_excerpt,
    tail: "The supplier shall maintain such certification for the duration of the contract and shall provide renewal evidence upon request.",
  },
  {
    lead: SAMPLE[2].source_excerpt,
    tail: "Each case study shall identify the contracting authority, the contract value and the outcomes achieved, and shall be no longer than two sides of A4.",
  },
  {
    lead: SAMPLE[4].source_excerpt,
    tail: SAMPLE[3].source_excerpt,
  },
  {
    lead: "10.1 Workforce Matters. The Transfer of Undertakings (Protection of Employment) Regulations may apply to this contract and tenderers shall satisfy themselves as to their application, and shall price accordingly. The supplier shall maintain employer's liability, public liability and professional indemnity insurance at the levels set out in Schedule 5 for the duration of the contract.",
  },
];
