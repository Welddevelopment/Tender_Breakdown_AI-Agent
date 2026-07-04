import type { Requirement, Tender } from "@/types/requirement";

// Live backend base URL. Unset → the app runs entirely on mock data (demo-safe
// default). Set NEXT_PUBLIC_API_BASE_URL (e.g. http://localhost:8000 locally, or
// the Render URL once deployed) to talk to the real API. See frontend-integration.md.
const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

export function isApiEnabled(): boolean {
  return BASE.length > 0;
}

// ---- Session token -----------------------------------------------------------
// Bidframe is a paid product: the live API is gated behind an account. We keep the
// bearer token in localStorage and attach it to every request. (localStorage, not an
// httpOnly cookie, because the API is a separate cross-origin service — a bearer
// header is the simplest correct fit for that split.)
const TOKEN_KEY = "bf-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable (private mode) — the session just won't persist.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

// Authorization header for the current session, spread into each fetch's headers.
function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

export interface TenderMember {
  id: string;
  email: string;
  name?: string | null;
  role: "owner" | "member";
  added_at?: string | null;
}

// POST /auth/login — exchange email + password for a bearer token, which we store.
export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await apiError(res, `Sign in failed (${res.status})`);
  const data = (await res.json()) as { token: string; user: AuthUser };
  setToken(data.token);
  return data.user;
}

// GET /auth/me — validate the stored token and return the account. Throws ApiError
// (401) if there is no valid session; the caller treats that as "signed out".
export async function getMe(): Promise<AuthUser> {
  const res = await fetch(`${BASE}/auth/me`, { headers: { ...authHeaders() } });
  if (!res.ok) throw await apiError(res, `Not signed in (${res.status})`);
  return (await res.json()) as AuthUser;
}

export function logout(): void {
  clearToken();
}

// Absolute URL to a PDF source document in the tender pack, opened at a given
// page. Browser PDF viewers honour the #page fragment. Empty string when no live
// API is configured, so callers can hide the link. `docId` selects the document
// in the pack; the session token rides as a query param because a plain
// <iframe>/link navigation cannot set an Authorization header.
export function tenderPdfPageUrl(
  tenderId: string,
  page: number,
  docId?: string | null
): string {
  if (!BASE) return "";
  const params = new URLSearchParams();
  if (docId) params.set("doc", docId);
  const token = getToken();
  if (token) params.set("token", token);
  const qs = params.toString();
  return `${BASE}/tenders/${tenderId}/pdf${qs ? `?${qs}` : ""}#page=${page}`;
}

// Static copies of the demo tenders' PDFs, shipped in /public so the read-only
// showcase can render + highlight the real document with no backend and no key.
// Keyed by the source_filename carried on each requirement.
const DEMO_PDFS: Record<string, string> = {
  "spso-cleaning.pdf": "/demo/spso-cleaning.pdf",
  // Bradwell — the J-081 stage tender; PDF shipped in /public/demo so the
  // "See a deal-breaker in the document" proof button renders key-independently.
  "bradwell-grounds-itt.pdf": "/demo/bradwell-grounds-itt.pdf",
};

// The source PDF URL for the claim/source verification view, WITHOUT the #page
// fragment (PDF.js selects the page itself). A live PDF tender streams from the
// backend (owner-scoped, token as a query param); the mock/demo build falls back
// to a static public copy for a known demo tender. Null when no PDF is available.
export function sourceDocUrl(opts: {
  tenderId: string | null;
  docId?: string | null;
  filename?: string | null;
}): string | null {
  const { tenderId, docId, filename } = opts;
  if (BASE && tenderId) {
    const params = new URLSearchParams();
    if (docId) params.set("doc", docId);
    const token = getToken();
    if (token) params.set("token", token);
    const qs = params.toString();
    return `${BASE}/tenders/${tenderId}/pdf${qs ? `?${qs}` : ""}`;
  }
  if (filename && DEMO_PDFS[filename]) return DEMO_PDFS[filename];
  return null;
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

// POST /tenders/upload — multipart form with the tender pack documents.
// Extraction runs on a background job; this returns { jobId, tenderId }
// immediately. Poll getJob(jobId) for live progress, then load the tender once
// the job is done.
export async function uploadTender(
  files: File[],
  title?: string
): Promise<{ jobId: string; tenderId: string }> {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  if (title) form.append("title", title);

  const res = await fetch(`${BASE}/tenders/upload`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: form,
  });
  if (!res.ok) throw await apiError(res, `Upload failed (${res.status})`);

  const data = (await res.json()) as UploadJobResult;
  return { jobId: data.job_id, tenderId: data.tender_id };
}

// GET /tenders/jobs/{id} — live extraction progress for an upload job. Maps the
// backend's snake_case fields onto JobStatus.
export async function getJob(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${BASE}/tenders/jobs/${jobId}`, {
    headers: { ...authHeaders() },
  });
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
  const res = await fetch(`${BASE}/tenders/${tenderId}/requirements`, {
    headers: { ...authHeaders() },
  });
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
  const res = await fetch(`${BASE}/tenders`, { headers: { ...authHeaders() } });
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
  const init: RequestInit = { method: "POST", headers: { ...authHeaders() } };
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
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await apiError(res, `Update failed (${res.status})`);
}

// Collaboration — GET /tenders/{id}/members, POST /tenders/{id}/share {email}.
export async function listMembers(tenderId: string): Promise<TenderMember[]> {
  const res = await fetch(`${BASE}/tenders/${tenderId}/members`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await apiError(res, `Couldn't load collaborators (${res.status})`);
  return ((await res.json()) as { members: TenderMember[] }).members;
}

export async function shareTender(
  tenderId: string,
  email: string
): Promise<TenderMember[]> {
  const res = await fetch(`${BASE}/tenders/${tenderId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw await apiError(res, `Share failed (${res.status})`);
  return ((await res.json()) as { members: TenderMember[] }).members;
}
