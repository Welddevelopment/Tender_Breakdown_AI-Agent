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
export function tenderPdfPageUrl(tenderId: string, page: number): string {
  if (!BASE) return "";
  return `${BASE}/tenders/${tenderId}/pdf#page=${page}`;
}

interface UploadResult {
  tender_id: string;
  requirement_count?: number;
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

// POST /tenders/upload — multipart form with the PDF; returns the new tender id.
export async function uploadTender(file: File, title?: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  if (title) form.append("title", title);

  const res = await fetch(`${BASE}/tenders/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw await apiError(res, `Upload failed (${res.status})`);

  const data = (await res.json()) as UploadResult;
  return data.tender_id;
}

// GET /tenders/{id}/requirements — returns the full tender in the locked schema.
export async function getTender(tenderId: string): Promise<Tender> {
  const res = await fetch(`${BASE}/tenders/${tenderId}/requirements`);
  if (!res.ok) throw await apiError(res, `Fetch failed (${res.status})`);
  return (await res.json()) as Tender;
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
