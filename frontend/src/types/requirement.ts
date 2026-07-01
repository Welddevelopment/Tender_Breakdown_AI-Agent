export type RequirementType = "mandatory" | "optional";
export type RequirementStatus = "pending" | "accepted" | "edited" | "flagged";

export interface RequirementDecision {
  action: string;
  note: string;
  timestamp: string;
}

// --- Auditable-autofill fields (additive, see autofill-scope-decision.md) ---
export type AnswerState = "auto" | "needs_input" | "human_edited" | "empty";

export interface EvidenceRef {
  doc_id: string;
  excerpt: string;
  page: number;
}

export interface Answer {
  text: string;
  state: AnswerState;
  evidence_refs: EvidenceRef[];
  confidence: number;
}

export interface OpenQuestion {
  id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
}

export interface CapabilityDoc {
  doc_id: string;
  filename: string;
  page_count: number;
}

export interface Requirement {
  id: string;
  text: string;
  source_page: number;
  source_clause: string | null; // nullable — raw extraction may have no detectable clause heading
  source_excerpt: string;
  type: RequirementType;
  is_gating: boolean;
  category: string;
  confidence: number;
  status: RequirementStatus;
  needs_review: boolean;
  decision: RequirementDecision | null;
  criteria_ref: string | null;
  depends_on: string[];
  draft_answer: string | null; // DEPRECATED alias of answer.text — kept so the v1 matrix UI keeps working
  // Optional/additive — the matrix renders without these; the answer + gap-interview UI adopts them incrementally.
  answer?: Answer | null;
  open_questions?: OpenQuestion[];
  // Multi-file tender packs (#4): which document in the pack this came from.
  source_doc_id?: string | null;
  source_filename?: string | null;
}

// A published award criterion for the tender (e.g. Quality 40%). Additive:
// requirements point at one via `criteria_ref`; absent until the tender
// publishes weighted criteria.
export interface AwardCriterion {
  id: string;
  name: string;
  weight: number;
}

export interface SourceDoc {
  doc_id: string;
  filename: string;
  page_count: number;
}

// The graph's name for the same shape (#27): both sides of the split-brain
// merge (matrix lens vs MarksView) added an identical published-criterion type,
// so one is an alias of the other. `id` matches Requirement.criteria_ref.
export type Criterion = AwardCriterion;

export interface Tender {
  tender_id: string;
  title: string;
  requirements: Requirement[];
  capability_docs?: CapabilityDoc[]; // bidder's uploaded evidence; empty until any are uploaded
  source_docs?: SourceDoc[]; // the documents in the tender pack (#4)
  award_criteria?: AwardCriterion[]; // published award criteria (#27); id matches criteria_ref; empty/absent until published
}
