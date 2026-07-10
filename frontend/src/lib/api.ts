import type {
  AnswerDecision,
  AnswerState,
  Requirement,
  Tender,
} from "@/types/requirement";

// Live backend base URL. Unset → the app runs entirely on mock data (demo-safe
// default). Set NEXT_PUBLIC_API_BASE_URL (e.g. http://localhost:8000 locally, or
// the Render URL once deployed) to talk to the real API. See frontend-integration.md.
const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

export function isApiEnabled(): boolean {
  return BASE.length > 0;
}

// The Google OAuth client id (Web) for "Sign in with Google". Set
// NEXT_PUBLIC_GOOGLE_CLIENT_ID to the SAME id the backend verifies against
// (GOOGLE_CLIENT_ID). Empty → the Google button is hidden; email/password still works.
export const GOOGLE_CLIENT_ID = (
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""
).trim();

export function isGoogleSignInEnabled(): boolean {
  return isApiEnabled() && GOOGLE_CLIENT_ID.length > 0;
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

// Headers for fetching a DOCUMENT by URL: the bearer header when the URL points
// at the live backend, nothing for the static /demo copies (same-origin public
// files need no auth, and the token must never leak to any other origin). This
// is how source viewers authenticate now that document URLs carry no ?token=.
export function docRequestHeaders(url: string): Record<string, string> {
  return BASE && url.startsWith(BASE) ? authHeaders() : {};
}

// Open a source document in a new tab WITHOUT a token in the URL. A plain <a>
// navigation cannot set an Authorization header, so: open the window
// synchronously (inside the click, so popup blockers allow it), fetch the file
// with the bearer header, and point the window at a blob URL — the #page
// fragment still lands in the browser's PDF viewer. Static /demo copies skip
// the fetch and navigate directly.
export async function openAuthedDocument(
  url: string,
  page?: number
): Promise<void> {
  // The URL may already carry a #page fragment (tenderPdfPageUrl does); an
  // explicit `page` argument wins. The fragment never travels on the fetch.
  const hashAt = url.indexOf("#");
  const file = hashAt === -1 ? url : url.slice(0, hashAt);
  const fragment = page
    ? `#page=${page}`
    : hashAt === -1
      ? ""
      : url.slice(hashAt);
  const needsAuth = Object.keys(docRequestHeaders(file)).length > 0;
  if (!needsAuth) {
    window.open(`${file}${fragment}`, "_blank", "noopener");
    return;
  }
  const win = window.open("about:blank", "_blank");
  try {
    const res = await fetch(file, { headers: docRequestHeaders(file) });
    if (!res.ok) throw await apiError(res, `Couldn't open the document (${res.status})`);
    const blobUrl = URL.createObjectURL(await res.blob());
    if (win) win.location.href = `${blobUrl}${fragment}`;
  } catch (error) {
    win?.close();
    throw error;
  }
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

export interface TenderActivityEvent {
  id: string;
  tender_id: string;
  req_id: string;
  action: string;
  note?: string | null;
  timestamp: string;
  actor?: AuthUser | null;
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

// POST /auth/google — exchange a Google ID token (from Google Identity Services) for a
// bearer token, which we store. Backend verifies the token with Google, then find-or-creates
// the account. Same session shape as password login, so the app is identical afterwards.
export async function loginWithGoogle(idToken: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (!res.ok) throw await apiError(res, `Google sign in failed (${res.status})`);
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
// in the pack. NO token in the URL (tokens in query strings land in history and
// access logs): callers open this via openAuthedDocument, which authenticates
// with the bearer header and hands the browser a blob URL.
export function tenderPdfPageUrl(
  tenderId: string,
  page: number,
  docId?: string | null
): string {
  if (!BASE) return "";
  const params = new URLSearchParams();
  if (docId) params.set("doc", docId);
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
// backend (owner-scoped, authenticated by bearer header — see docRequestHeaders;
// no token in the URL); the mock/demo build falls back to a static public copy
// for a known demo tender. Null when no PDF is available.
export function sourceDocUrl(opts: {
  tenderId: string | null;
  docId?: string | null;
  filename?: string | null;
}): string | null {
  const { tenderId, docId, filename } = opts;
  if (BASE && tenderId) {
    const params = new URLSearchParams();
    if (docId) params.set("doc", docId);
    const qs = params.toString();
    return `${BASE}/tenders/${tenderId}/pdf${qs ? `?${qs}` : ""}`;
  }
  if (filename && DEMO_PDFS[filename]) return DEMO_PDFS[filename];
  return null;
}

// The live-backend URL for ANY document in a tender pack (PDF/DOCX/XLSX/CSV),
// via the generic /source endpoint — the Office-format sibling of sourceDocUrl
// (which is PDF-specific and kept as-is for the existing #page deep-link use).
// Null when there's no live backend configured (mock/demo build resolves its own
// static copy instead — see source-doc.ts's sourceDocRawUrl).
export function sourceDocRawFileUrl(opts: {
  tenderId: string | null;
  docId?: string | null;
}): string | null {
  const { tenderId, docId } = opts;
  if (!BASE || !tenderId) return null;
  const params = new URLSearchParams();
  if (docId) params.set("doc", docId);
  const qs = params.toString();
  return `${BASE}/tenders/${tenderId}/source${qs ? `?${qs}` : ""}`;
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
  filesTotal?: number;
  filesDone?: number;
  docs?: { docId: string; filename: string; stage: string }[];
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
    filesTotal: j.files_total as number | undefined,
    filesDone: j.files_done as number | undefined,
    docs: Array.isArray(j.docs)
      ? j.docs.map((d) => ({
          docId: String((d as { doc_id?: unknown }).doc_id ?? ""),
          filename: String((d as { filename?: unknown }).filename ?? ""),
          stage: String((d as { stage?: unknown }).stage ?? ""),
        }))
      : undefined,
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
  // Optional per-tender signals. The backend's GET /tenders sends only the three
  // fields above today; these are parsed when present so the list lights up the
  // moment the API starts sending them, and renders complete without them.
  dealBreakerCount?: number;
  decidedCount?: number;
  uploadedAt?: string; // ISO timestamp
  // Collaboration signals (Stage 4 follow-ups): `shared` is true when the caller
  // can see this tender but doesn't own it (someone shared it in); `memberCount`
  // is the number of people with access (shared members + the owner).
  shared?: boolean;
  memberCount?: number;
}

// GET /tenders — a summary of every uploaded tender (id, title, requirement count,
// plus any optional signals the backend has started sending — see TenderSummary).
export async function getTenders(): Promise<TenderSummary[]> {
  const res = await fetch(`${BASE}/tenders`, { headers: { ...authHeaders() } });
  if (!res.ok) throw await apiError(res, `Couldn't load your tenders (${res.status})`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  return rows.map((r) => {
    const summary: TenderSummary = {
      tenderId: r.tender_id as string,
      title: r.title as string,
      requirementCount: r.requirement_count as number,
    };
    // Defensive optional parsing: only adopt a signal when it arrives with the
    // right type, so a half-rolled-out backend can never break the list.
    if (typeof r.deal_breaker_count === "number" && r.deal_breaker_count >= 0) {
      summary.dealBreakerCount = r.deal_breaker_count;
    }
    if (typeof r.decided_count === "number" && r.decided_count >= 0) {
      summary.decidedCount = r.decided_count;
    }
    const uploaded = r.uploaded_at ?? r.created_at;
    if (typeof uploaded === "string" && uploaded.trim()) {
      summary.uploadedAt = uploaded;
    }
    if (typeof r.shared === "boolean") {
      summary.shared = r.shared;
    }
    if (typeof r.member_count === "number" && r.member_count >= 0) {
      summary.memberCount = r.member_count;
    }
    return summary;
  });
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

// Body for PATCH /requirements/{id}/answer — human answer content, all optional so
// callers send only what changed. `decision` sets/replaces the verdict (actor is
// stamped server-side, so it's omitted here); `clear_decision` reopens it.
export interface AnswerContentUpdate {
  text?: string;
  state?: AnswerState;
  confidence?: number;
  open_questions?: {
    id: string;
    answer: string | null;
    answered_at?: string | null;
  }[];
  decision?: Omit<AnswerDecision, "actor">;
  clear_decision?: boolean;
}

// PATCH /requirements/{id}/answer — persist answer text, gap answers, and the
// answer verdict server-side (the content that was localStorage-only before).
export async function patchAnswer(
  id: string,
  body: AnswerContentUpdate
): Promise<void> {
  const res = await fetch(`${BASE}/requirements/${id}/answer`, {
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

export async function listTenderActivity(
  tenderId: string
): Promise<TenderActivityEvent[]> {
  const res = await fetch(`${BASE}/tenders/${tenderId}/activity`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await apiError(res, `Couldn't load activity (${res.status})`);
  return ((await res.json()) as { events: TenderActivityEvent[] }).events;
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

// ---- Teams (persistent collaboration groups) ---------------------------------
// A team is a group you add authenticated users to once; tenders shared to a team are
// visible to everyone on it (GET /tenders lists them, access is granted server-side).

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  myRole: "owner" | "member";
  memberCount: number;
}

// Team members share TenderMember's shape (id/email/name/role/added_at), so the same
// collaborator colour treatment renders both.
export type TeamMember = TenderMember;

function toTeam(r: Record<string, unknown>): Team {
  return {
    id: r.id as string,
    name: r.name as string,
    ownerId: r.owner_id as string,
    createdAt: r.created_at as string,
    myRole: (r.my_role as Team["myRole"]) ?? "member",
    memberCount: (r.member_count as number) ?? 1,
  };
}

// GET /teams — the teams the signed-in user owns or belongs to.
export async function getTeams(): Promise<Team[]> {
  const res = await fetch(`${BASE}/teams`, { headers: { ...authHeaders() } });
  if (!res.ok) throw await apiError(res, `Couldn't load your teams (${res.status})`);
  const rows = ((await res.json()) as { teams: Record<string, unknown>[] }).teams;
  return rows.map(toTeam);
}

// POST /teams — create a team (caller becomes owner). Returns the new team.
export async function createTeam(name: string): Promise<Team> {
  const res = await fetch(`${BASE}/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw await apiError(res, `Couldn't create the team (${res.status})`);
  return toTeam((await res.json()).team);
}

// GET /teams/{id}/members — everyone on a team (owner first).
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const res = await fetch(`${BASE}/teams/${teamId}/members`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await apiError(res, `Couldn't load the team (${res.status})`);
  return ((await res.json()) as { members: TeamMember[] }).members;
}

// POST /teams/{id}/members — add a registered user by email (owner-only).
export async function addTeamMember(
  teamId: string,
  email: string
): Promise<TeamMember[]> {
  const res = await fetch(`${BASE}/teams/${teamId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw await apiError(res, `Couldn't add them (${res.status})`);
  return ((await res.json()) as { members: TeamMember[] }).members;
}

// DELETE /teams/{id}/members/{memberId} — remove a member (owner-only; not the owner).
export async function removeTeamMember(
  teamId: string,
  memberId: string
): Promise<TeamMember[]> {
  const res = await fetch(`${BASE}/teams/${teamId}/members/${memberId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await apiError(res, `Couldn't remove them (${res.status})`);
  return ((await res.json()) as { members: TeamMember[] }).members;
}

// POST /tenders/{id}/team — share the tender with a team (teamId=null unshares).
export async function shareTenderWithTeam(
  tenderId: string,
  teamId: string | null
): Promise<void> {
  const res = await fetch(`${BASE}/tenders/${tenderId}/team`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ team_id: teamId }),
  });
  if (!res.ok) throw await apiError(res, `Couldn't share with the team (${res.status})`);
}

// ---- Comments (per-requirement collaboration) --------------------------------

export interface Comment {
  id: string;
  req_id: string;
  author_id: string;
  author_name: string | null;
  body: string;
  created_at: string;
}

// GET /requirements/{id}/comments — the team's notes on one requirement (oldest first).
export async function getComments(reqId: string): Promise<Comment[]> {
  const res = await fetch(`${BASE}/requirements/${reqId}/comments`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await apiError(res, `Couldn't load comments (${res.status})`);
  return ((await res.json()) as { comments: Comment[] }).comments;
}

// POST /requirements/{id}/comments — add a note (author stamped server-side).
export async function postComment(reqId: string, body: string): Promise<Comment> {
  const res = await fetch(`${BASE}/requirements/${reqId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw await apiError(res, `Couldn't post the comment (${res.status})`);
  return (await res.json()) as Comment;
}

// ---- Live collaboration stream (SSE) -----------------------------------------
// The EventSource URL for a tender's live event stream (decisions, comments, members).
// The bearer token rides as a query param because EventSource can't set headers. Empty
// string when there's no live API, so callers can skip subscribing.
export function tenderEventsUrl(tenderId: string): string {
  if (!BASE) return "";
  const token = getToken();
  const qs = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${BASE}/tenders/${tenderId}/events${qs}`;
}

// One decoded event off that stream. `type` selects the payload the UI reacts to.
export interface TenderEvent {
  type: "requirement" | "comment" | "members";
  req_id?: string;
  status?: Requirement["status"];
  decision?: Requirement["decision"];
  comment?: Comment;
  members?: TenderMember[];
}
