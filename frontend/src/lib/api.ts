import type { Requirement, Tender } from "@/types/requirement";

// Live backend base URL. Unset → the app runs entirely on mock data (demo-safe
// default). Set NEXT_PUBLIC_API_BASE_URL (e.g. http://localhost:8000 locally, or
// the Render URL once deployed) to talk to the real API. See frontend-integration.md.
const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

export function isApiEnabled(): boolean {
  return BASE.length > 0;
}

interface UploadResult {
  tender_id: string;
  requirement_count?: number;
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
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);

  const data = (await res.json()) as UploadResult;
  return data.tender_id;
}

// GET /tenders/{id}/requirements — returns the full tender in the locked schema.
export async function getTender(tenderId: string): Promise<Tender> {
  const res = await fetch(`${BASE}/tenders/${tenderId}/requirements`);
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
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
  if (!res.ok) throw new Error(`Update failed (${res.status})`);
}
