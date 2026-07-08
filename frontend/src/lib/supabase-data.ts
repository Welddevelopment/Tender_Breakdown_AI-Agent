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
import type { JobStatus, TenderSummary } from "@/lib/api";

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

// ---- Upload + job queue -------------------------------------------------------------
// Production upload goes browser → Supabase directly: the pack lands in Storage under
// the org's folder, a tender row is created as `processing`, and a `jobs` row is queued
// for the Python worker. No server hop, so serverless time limits never touch a
// 200-page tender pack — the worker (an always-on process) does the long work.

const BUCKET = "tender-docs";

export async function uploadTenderPack(
  supabase: SupabaseClient,
  files: File[],
  title: string
): Promise<{ tenderId: string; jobId: string }> {
  // 1. The tender row. org_id/created_by default from the JWT in the database.
  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .insert({ title, filename: files[0]?.name ?? null, status: "processing" })
    .select("id, org_id")
    .single();
  if (tenderError) throw new Error(tenderError.message);

  // 2. The documents, at <org>/<tender>/<doc_id><ext> (the path RLS checks the org on).
  const docs: { doc_id: string; path: string; filename: string }[] = [];
  for (const [i, file] of files.entries()) {
    const docId = `d${i + 1}`;
    const ext = file.name.includes(".")
      ? `.${file.name.split(".").pop()!.toLowerCase()}`
      : "";
    const path = `${tender.org_id}/${tender.id}/${docId}${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) {
      // Leave an honest failed tender rather than a phantom processing one.
      await supabase
        .from("tenders")
        .update({ status: "failed", error: `Upload failed: ${uploadError.message}` })
        .eq("id", tender.id);
      throw new Error(uploadError.message);
    }
    docs.push({ doc_id: docId, path, filename: file.name });
  }

  // 3. The queued job the worker claims.
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      tender_id: tender.id,
      kind: "extract",
      payload: { title, docs },
    })
    .select("id")
    .single();
  if (jobError) throw new Error(jobError.message);

  return { tenderId: tender.id, jobId: job.id };
}

// Map a jobs row onto the JobStatus shape ProcessingView already renders — the worker
// writes the same snake_case progress fields the old backend registry used.
export function jobRowToStatus(row: {
  status: string;
  progress: Record<string, unknown> | null;
  error: string | null;
}): JobStatus {
  const p = row.progress ?? {};
  return {
    status:
      row.status === "done"
        ? "done"
        : row.status === "error"
          ? "error"
          : "processing",
    stage: (p.stage as string) ?? (row.status === "queued" ? "queued" : ""),
    message: p.message as string | undefined,
    progress: (p.progress as number) ?? 0,
    tenderId: p.tender_id as string | undefined,
    requirementCount: p.requirement_count as number | undefined,
    dealBreakerCount: p.deal_breaker_count as number | undefined,
    rawCount: p.raw_count as number | undefined,
    chunkDone: p.done as number | undefined,
    chunkTotal: p.total as number | undefined,
    pageCount: p.page_count as number | undefined,
    sectionCount: p.section_count as number | undefined,
    detail: row.error ?? (p.detail as string | undefined),
  };
}

// Watch a job to completion: Realtime UPDATE stream + a slow poll as belt-and-braces
// (a dropped websocket must never strand the progress bar). Resolves on done/error.
export function watchJob(
  supabase: SupabaseClient,
  jobId: string,
  onUpdate: (job: JobStatus) => void
): Promise<JobStatus> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const finish = (status: JobStatus) => {
      if (settled) return;
      settled = true;
      if (pollTimer) clearInterval(pollTimer);
      void supabase.removeChannel(channel);
      resolve(status);
    };

    const handleRow = (row: {
      status: string;
      progress: Record<string, unknown> | null;
      error: string | null;
    }) => {
      const status = jobRowToStatus(row);
      onUpdate(status);
      if (status.status === "done" || status.status === "error") finish(status);
    };

    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        (payload) => handleRow(payload.new as JobRow)
      )
      .subscribe();

    const poll = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("status, progress, error")
        .eq("id", jobId)
        .single();
      if (error) {
        if (!settled) {
          settled = true;
          if (pollTimer) clearInterval(pollTimer);
          void supabase.removeChannel(channel);
          reject(new Error(error.message));
        }
        return;
      }
      handleRow(data);
    };
    void poll();
    pollTimer = setInterval(() => void poll(), 5000);
  });
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
