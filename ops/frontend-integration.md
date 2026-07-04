# Frontend → Backend Integration (for the frontend agent)

The backend API is **built, tested, and ready** (ingest → extract → SQLite → REST). Your job: swap the
mock data for the real API. The response shape **matches the locked schema you already render**, so the
compliance matrix should work with no UI changes — you're just changing where the data comes from.

> Backend is in `/backend` (not your lane to edit). This doc is the contract. Questions → `comms/board-frontend.md`, tag `@j`.

## 1. The API base URL (one env var)

Add `NEXT_PUBLIC_API_BASE_URL` to your env:
- **Local dev:** `http://localhost:8000` (run the backend with `uvicorn app.main:app --reload`)
- **Deployed:** the backend's public URL — **J/backend will deploy the backend and give you the URL**
  (you don't deploy the backend; it's an org-repo Render deploy that needs the repo owner). Once you have
  it, set it in Vercel → Project → Settings → Environment Variables.

> **Your deploy scope = the Vercel frontend only** (which you already manage). The backend hosting is
> handled separately — you just need the URL. CORS already allows `localhost:3000` + any `*.vercel.app`
> origin, so once the env var points at the backend, it just works.

## 2. The three endpoints

### Upload a tender — `POST /tenders/upload`
`multipart/form-data` with `file` (the PDF) and optional `title`.
```ts
const fd = new FormData();
fd.append("file", pdfFile);            // from your UploadDropzone
fd.append("title", "SPSO Cleaning ITT");
const res = await fetch(`${BASE}/tenders/upload`, { method: "POST", body: fd });
const { tender_id, requirement_count } = await res.json();
```
Processing is synchronous (a few seconds). Then fetch the requirements with `tender_id`.

### Get the requirements — `GET /tenders/{tender_id}/requirements`
Returns exactly your locked schema:
```jsonc
{
  "tender_id": "tnd-ab12cd34",
  "title": "SPSO Cleaning ITT",
  "requirements": [ { /* id, text, source_page, source_clause, source_excerpt, type,
                        is_gating, category, confidence, status, needs_review, decision,
                        criteria_ref, depends_on, draft_answer, answer, open_questions */ } ],
  "capability_docs": []
}
```
Drop this straight into the array your matrix already maps over.

### Save a decision — `PATCH /requirements/{id}`
Body (both fields optional):
```ts
await fetch(`${BASE}/requirements/${req.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    status: "accepted",                                  // pending|accepted|edited|flagged
    decision: { action: "approve", note: "", timestamp: new Date().toISOString() },
  }),
});
```
Returns the updated requirement. Wire your approve/edit/flag buttons to this.

## 3. Suggested steps

1. Add a tiny `src/lib/api.ts` with `uploadTender()`, `getRequirements(id)`, `updateRequirement(id, body)`
   reading `process.env.NEXT_PUBLIC_API_BASE_URL`.
2. Point `RequirementsContext` (or wherever mock loads) at `getRequirements()` instead of the mock import.
3. Wire `UploadDropzone` → `uploadTender()` → then `getRequirements(tender_id)` → populate the matrix.
4. Wire the decision controls → `updateRequirement()`.
5. **Keep the mock as a fallback** — e.g. if `NEXT_PUBLIC_API_BASE_URL` is unset, use the mock. That way
   the demo still works if the backend is asleep/down. (Belt and braces for stage.)

## 4. Notes
- **No schema changes needed** — the API returns the shape your `requirement.ts` types already describe.
  (The additive `answer` / `open_questions` / `capability_docs` fields are there too, for the autofill UI
  later — ignore them for the matrix.)
- `is_gating`, `needs_review`, `confidence`, `source_page/excerpt`, `criteria_ref`, `depends_on` are all
  populated for real now — your gating hero, the uncertainty styling, and the graph view get real data.
- Today's extractor is heuristic (works with no key); it auto-upgrades to GPT when the backend gets the
  OpenAI key. Either way the response shape is identical, so your code doesn't change.

That's it — point at the URL, swap the data source, decisions persist. Ping `@j` if anything's unclear.
