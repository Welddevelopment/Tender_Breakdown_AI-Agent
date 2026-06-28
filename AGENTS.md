# Tender Breakdown — Agent Guide

Conduct "Make Legacy Move" hackathon project. This repo extracts requirements from UK public-sector tender PDFs and presents them in a compliance matrix for bid managers to review.

## Repo layout

```
/backend          Python + FastAPI (PDF ingest, extraction, API) — not yet scaffolded
/frontend         Next.js + React + Tailwind — compliance matrix UI (Day 1 deliverable)
tender-master-plan.md   Source of truth for schema, pipeline, and roles
role-*.md         Per-person day-by-day briefs
```

## Data contract (lock this shape)

Every requirement flowing through the system matches this schema. Frontend builds against mock data in this exact shape; backend + generalist produce it for real.

```json
{
  "id": "req-0001",
  "text": "The supplier must hold ISO 9001 certification.",
  "source_page": 14,
  "source_clause": "Section 4.2.1",
  "source_excerpt": "verbatim snippet the requirement was extracted from",
  "type": "mandatory",
  "is_gating": true,
  "category": "certification",
  "confidence": 0.92,
  "status": "pending",
  "needs_review": false,
  "decision": null,
  "criteria_ref": "award-criterion-3",
  "depends_on": ["req-0007"],
  "draft_answer": null
}
```

A tender response: `{ "tender_id", "title", "requirements": [ ...requirement objects ] }`.

## Frontend conventions

- **Stack:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4.
- **Mock-first:** `src/data/mock-requirements.ts` holds fake data shaped like real API output. Swap the data source later — the UI should not change.
- **Compliance matrix columns:** requirement text · mandatory? · source · confidence · status.
- **Visual rules (non-negotiable for judges):**
  - `is_gating` mandatory requirements must stand out (badge + row highlight).
  - `needs_review` items must look obviously uncertain — the tool is honest, not guessing.
  - Confidence is shown as a glanceable bar/dot, never a raw number like "0.92".
- **Components live in** `src/components/`. Types in `src/types/`.
- Read `node_modules/next/dist/docs/` before changing Next.js APIs — v16 has breaking changes from earlier versions.

## Backend API (future)

FastAPI will expose:

- `POST /tenders/upload` — ingest PDF
- `GET /tenders/{id}/requirements` — requirement list
- `PATCH /requirements/{id}` — update status + decision

Frontend currently uses mock data only. Point `page.tsx` at the API when backend Day 1 mock endpoint is ready.

## Commands

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

## What not to do

- Do not change the requirement schema without team agreement (Day 1 lock).
- Do not show raw confidence numbers in the UI.
- Do not over-build graph view, upload flow, or answer-draft before the matrix works.
- Do not commit `.env`, credentials, or `node_modules`.

## Team roles

| Person | Owns |
|--------|------|
| Backend | PDF ingest, chunk, extract, classify, graph, REST API, SQLite |
| Generalist | Reconcile/dedupe, confidence routing, eval harness, answer-draft |
| Frontend | Compliance matrix, source panel, decision controls, graph view, demo |
| J | Prompts, orchestration, narrative, standups, glue |

See `role-*.md` for day-by-day build order.
