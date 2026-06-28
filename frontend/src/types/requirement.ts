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
  source_clause: string;
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
}

export interface Tender {
  tender_id: string;
  title: string;
  requirements: Requirement[];
  capability_docs?: CapabilityDoc[]; // bidder's uploaded evidence; empty until any are uploaded
}
