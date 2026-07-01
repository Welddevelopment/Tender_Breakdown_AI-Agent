import type { Requirement } from "@/types/requirement";

// Curated, scripted data for the /demo cinematic scroll (the pinned "stage").
// The scrollytelling story is choreographed, not live, so it runs on a small,
// hand-picked set rather than the frozen SPSO tender the hands-on section uses.
// Five requirements chosen so each beat lands cleanly:
//   - TWO gating deal-breakers (SAMPLE_GATING) compose the oxblood card (beat 3),
//   - one low-confidence needs_review row reads amber in the honesty beat (beat 4),
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
    category: "certification",
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
    confidence: 0.82,
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
    category: "service-levels",
    confidence: 0.58,
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
    confidence: 0.71,
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

// The two deal-breakers, in the order the oxblood card lifts them out.
export const SAMPLE_GATING = SAMPLE.filter((r) => r.is_gating);

// The requirement whose grounded answer + receipt drives the autofill beats.
export const SAMPLE_ANSWERED = SAMPLE[0];
