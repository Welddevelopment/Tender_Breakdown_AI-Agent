import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Answer,
  AwardCriterion,
  CapabilityDoc,
  OpenQuestion,
  Requirement,
  RequirementDecision,
  RequirementStatus,
  RequirementType,
  SourceDoc,
  Tender,
} from "@/types/requirement";
import type { TenderSummary } from "@/lib/api";

// Production data access: the queries the app runs against Supabase, mirroring the
// legacy api.ts surface so RequirementsContext/TendersList route by mode without the
// UI changing. All reads/writes run under the caller's Clerk JWT — RLS scopes every
// row to the active org, and DB triggers stamp attribution (see supabase/migrations).

// ---- Row shapes (supabase/migrations/0001_production_init.sql) -----------------

export interface RequirementRow {
  pk: string;
  tender_id: string;
  org_id: string;
  seq: number;
  req_id: string;
  text: string;
  source_page: number;
  source_clause: string | null;
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
  answer: Answer | null;
  open_questions: OpenQuestion[];
  source_doc_id: string | null;
  source_filename: string | null;
  source_rect: number[][] | null;
  source_rect_match: "exact" | "approx" | null;
}

export interface TenderRow {
  id: string;
  org_id: string;
  title: string;
  filename: string | null;
  status: "processing" | "ready" | "failed";
  error: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  source_docs: SourceDoc[];
  award_criteria: AwardCriterion[];
  capability_docs: CapabilityDoc[];
}

export interface JobRow {
  id: string;
  tender_id: string;
  kind: "extract" | "draft";
  status: "queued" | "running" | "done" | "error";
  progress: Record<string, unknown>;
  error: string | null;
}

export interface CommentRow {
  id: string;
  requirement_pk: string;
  tender_id: string;
  author_id: string;
  author_name: string | null;
  body: string;
  created_at: string;
}

// ---- Mapping --------------------------------------------------------------------

export function rowToRequirement(row: RequirementRow): Requirement {
  return {
    id: row.req_id,
    db_id: row.pk,
    text: row.text,
    source_page: row.source_page,
    source_clause: row.source_clause,
    source_excerpt: row.source_excerpt,
    type: row.type,
    is_gating: row.is_gating,
    category: row.category,
    confidence: row.confidence,
    status: row.status,
    needs_review: row.needs_review,
    decision: row.decision,
    criteria_ref: row.criteria_ref,
    depends_on: row.depends_on ?? [],
    draft_answer: row.draft_answer,
    answer: row.answer,
    open_questions: row.open_questions ?? [],
    source_doc_id: row.source_doc_id,
    source_filename: row.source_filename,
    source_rect: row.source_rect,
    source_rect_match: row.source_rect_match,
  };
}

// ---- Queries ----------------------------------------------------------------------

// The full tender in the locked wire shape (mirrors GET /tenders/{id}/requirements).
export async function fetchTender(
  supabase: SupabaseClient,
  tenderId: string
): Promise<Tender> {
  const [tenderRes, reqRes] = await Promise.all([
    supabase.from("tenders").select("*").eq("id", tenderId).single(),
    supabase
      .from("requirements")
      .select("*")
      .eq("tender_id", tenderId)
      .order("seq"),
  ]);
  if (tenderRes.error) throw new Error(tenderRes.error.message);
  if (reqRes.error) throw new Error(reqRes.error.message);
  const tender = tenderRes.data as TenderRow;
  return {
    tender_id: tender.id,
    title: tender.title,
    requirements: ((reqRes.data as RequirementRow[]) ?? []).map(rowToRequirement),
    capability_docs: tender.capability_docs ?? [],
    source_docs: tender.source_docs ?? [],
    award_criteria: tender.award_criteria ?? [],
  };
}

// The tender library (mirrors GET /tenders). Ready tenders only carry counts.
export async function fetchTenderSummaries(
  supabase: SupabaseClient
): Promise<TenderSummary[]> {
  const { data, error } = await supabase
    .from("tenders")
    .select("id, title, created_at, requirements(is_gating, status)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((t) => {
    const reqs = (t.requirements ?? []) as { is_gating: boolean; status: string }[];
    return {
      tenderId: t.id as string,
      title: t.title as string,
      requirementCount: reqs.length,
      dealBreakerCount: reqs.filter((r) => r.is_gating).length,
      decidedCount: reqs.filter((r) => r.status !== "pending").length,
      uploadedAt: t.created_at as string,
    };
  });
}

// Persist a decision (mirrors PATCH /requirements/{id}). The DB trigger overwrites
// decision.actor.id from the JWT, so attribution stays unforgeable.
export async function persistDecision(
  supabase: SupabaseClient,
  tenderId: string,
  reqId: string,
  patch: { status?: RequirementStatus; decision?: RequirementDecision | null }
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.decision !== undefined) dbPatch.decision = patch.decision;
  if (Object.keys(dbPatch).length === 0) return;
  const { error } = await supabase
    .from("requirements")
    .update(dbPatch)
    .eq("tender_id", tenderId)
    .eq("req_id", reqId);
  if (error) throw new Error(error.message);
}

// ---- Comments ---------------------------------------------------------------------

export async function fetchComments(
  supabase: SupabaseClient,
  requirementPk: string
): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("requirement_pk", requirementPk)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data as CommentRow[]) ?? [];
}

export async function insertComment(
  supabase: SupabaseClient,
  args: {
    requirementPk: string;
    tenderId: string;
    body: string;
    authorName: string | null;
  }
): Promise<CommentRow> {
  // author_id is stamped by the DB trigger from the JWT; author_name is a display
  // convenience snapshot (identity trust rides on author_id, never the name).
  const { data, error } = await supabase
    .from("comments")
    .insert({
      requirement_pk: args.requirementPk,
      tender_id: args.tenderId,
      author_name: args.authorName,
      body: args.body,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CommentRow;
}
