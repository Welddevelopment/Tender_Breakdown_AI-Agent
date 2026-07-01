import type { Requirement, Tender } from "@/types/requirement";

// Live backend base URL. Unset → the app runs entirely on mock data (demo-safe
// default). Set NEXT_PUBLIC_API_BASE_URL (e.g. http://localhost:8000 locally, or
// the Render URL once deployed) to talk to the real API. See frontend-integration.md.
const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

export function isApiEnabled(): boolean {
  return BASE.length > 0;
}

// Absolute URL to the original tender PDF opened at a given page — browser PDF
// viewers honour the #page fragment. Empty string when no live API is configured
// (the mock/demo has no stored PDF), so callers can hide the link.
export function tenderPdfPageUrl(
  tenderId: string,
  page: number,
  docId?: string | null
): string {
  if (!BASE) return "";
  const doc = docId ? `?doc=${docId}` : "";
  return `${BASE}/tenders/${tenderId}/pdf${doc}#page=${page}`;
}

interface UploadJobResult {
  job_id: string;
  tender_id: string;
}

// Live progress of a background extraction job (poll GET /tenders/jobs/{id}).
// Fields beyond status/stage/progress are filled in as the pipeline reaches them.
export interface JobStatus {
  status: "processing" | "done" | "error";
  stage: string;
  message?: string;
  progress: number; // 0..1
  tenderId?: string;
  requirementCount?: number;
  dealBreakerCount?: number;
  rawCount?: number;
  chunkDone?: number;
  chunkTotal?: number;
  pageCount?: number;
  sectionCount?: number;
  detail?: string; // on error
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiError(res: Response, fallback: string): Promise<ApiError> {
  let message = fallback;
  try {
    const body = (await res.clone().json()) as {
      detail?: unknown;
      message?: unknown;
    };
    const detail = body.detail ?? body.message;
    if (typeof detail === "string" && detail.trim()) message = detail;
  } catch {
    try {
      const text = await res.text();
      if (text.trim()) message = text.trim();
    } catch {
      // Some error responses are empty; keep the fallback.
    }
  }
  return new ApiError(message, res.status);
}

// POST /tenders/upload — multipart form with the PDF. Extraction runs on a
// background job; this returns { jobId, tenderId } immediately. Poll getJob(jobId)
// for live progress, then load the tender once the job is done.
export async function uploadTender(
  files: File[],
  title?: string
): Promise<{ jobId: string; tenderId: string }> {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  if (title) form.append("title", title);

  const res = await fetch(`${BASE}/tenders/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw await apiError(res, `Upload failed (${res.status})`);

  const data = (await res.json()) as UploadJobResult;
  return { jobId: data.job_id, tenderId: data.tender_id };
}

// GET /tenders/jobs/{id} — live extraction progress for an upload job. Maps the
// backend's snake_case fields onto JobStatus.
export async function getJob(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${BASE}/tenders/jobs/${jobId}`);
  if (!res.ok) throw await apiError(res, `Couldn't get progress (${res.status})`);
  const j = (await res.json()) as Record<string, unknown>;
  return {
    status: (j.status as JobStatus["status"]) ?? "processing",
    stage: (j.stage as string) ?? "",
    message: j.message as string | undefined,
    progress: (j.progress as number) ?? 0,
    tenderId: j.tender_id as string | undefined,
    requirementCount: j.requirement_count as number | undefined,
    dealBreakerCount: j.deal_breaker_count as number | undefined,
    rawCount: j.raw_count as number | undefined,
    chunkDone: j.done as number | undefined,
    chunkTotal: j.total as number | undefined,
    pageCount: j.page_count as number | undefined,
    sectionCount: j.section_count as number | undefined,
    detail: j.detail as string | undefined,
  };
}

// GET /tenders/{id}/requirements — returns the full tender in the locked schema.
export async function getTender(tenderId: string): Promise<Tender> {
  const res = await fetch(`${BASE}/tenders/${tenderId}/requirements`);
  if (!res.ok) throw await apiError(res, `Fetch failed (${res.status})`);
  return (await res.json()) as Tender;
}

export interface TenderSummary {
  tenderId: string;
  title: string;
  requirementCount: number;
}

// GET /tenders — a summary of every uploaded tender (id, title, requirement count).
export async function getTenders(): Promise<TenderSummary[]> {
  const res = await fetch(`${BASE}/tenders`);
  if (!res.ok) throw await apiError(res, `Couldn't load your tenders (${res.status})`);
  const rows = (await res.json()) as Array<{
    tender_id: string;
    title: string;
    requirement_count: number;
  }>;
  return rows.map((r) => ({
    tenderId: r.tender_id,
    title: r.title,
    requirementCount: r.requirement_count,
  }));
}

// POST /tenders/{id}/draft — auditable autofill: draft a grounded answer per
// requirement from the bidder's capability docs (or flag needs_input). Returns the
// enriched tender. provider "openai" = precise grounded prose, "mock" = free
// deterministic; omit for the server default. Optional capability files (.txt/.pdf)
// swap in the real bidder's evidence for this draft.
export async function draftAnswers(
  tenderId: string,
  opts: { provider?: "openai" | "mock"; files?: File[] } = {}
): Promise<Tender> {
  const query = opts.provider ? `?provider=${opts.provider}` : "";
  const init: RequestInit = { method: "POST" };
  if (opts.files && opts.files.length > 0) {
    const form = new FormData();
    for (const file of opts.files) form.append("files", file);
    init.body = form;
  }
  const res = await fetch(`${BASE}/tenders/${tenderId}/draft${query}`, init);
  if (!res.ok) throw await apiError(res, `Autofill failed (${res.status})`);
  return (await res.json()) as Tender;
}

// PATCH /requirements/{id} — persist a status + decision change.
export async function patchRequirement(
  id: string,
  body: Partial<Pick<Requirement, "status" | "decision">>
): Promise<void> {
  const res = await fetch(`${BASE}/requirements/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await apiError(res, `Update failed (${res.status})`);
}
