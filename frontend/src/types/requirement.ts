export type RequirementType = "mandatory" | "optional";
export type RequirementStatus = "pending" | "accepted" | "edited" | "flagged";

export interface RequirementDecision {
  action: string;
  note: string;
  timestamp: string;
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
  draft_answer: string | null;
}

export interface Tender {
  tender_id: string;
  title: string;
  requirements: Requirement[];
}
