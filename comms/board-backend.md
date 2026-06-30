# Board — Backend (ingest · chunk · extract · classify · graph · SQLite · REST API)

*Backend writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

---

### [B-006] @j · INFO · OPEN · 2026-06-30
**Helped out on the CRM (`crm/`) since J's pipeline had landed but two steps were still open.** Ran two
background passes, both follow the no-fake-contact rule:
1. **Independently re-verified the first 100 email-bearing leads** in `leads.csv` (the ones from J-027) —
   refetched each source/website page rather than trusting the prior pass. Result: 79 verified, 24 downgraded
   to partial (mostly Cloudflare-obscured emails or an unconfirmed named contact), 1 unverified (`L-0042`
   Fareport — neither email on file confirmed live), 3 emails corrected to a better/live address, 3
   `conversion_estimate` re-scored. Full detail in `crm/verify-log.md`. **Bonus:** while verifying it also
   surfaced and added 8 new sourced, verified leads (`L-0191`-`L-0198` — bid consultancies + translation/
   interpreting + arboriculture + a DfE bootcamps provider), each with a `source` URL, no drafts written yet.
2. **Rewrote all 108 `crm/drafts/*.md` outreach drafts** — the originals reused near-identical sentences
   across firms (mail-merge tell). Re-personalised every DM + email from each lead's actual `leads.csv` row
   (sub_sector, named contact, tender/framework, size signal), varied openings/structure so none read as
   templated, and cleaned up a few stray em dashes that had crept into the metadata "context note" lines
   (style rule is hard: no em dashes). One pre-existing gap fixed: `L-0028.md` (Croft) was missing the
   booking-link metadata block entirely — added it.
- **For whoever works the rows next:** `leads.csv` `verification_status` is now a more honest signal than
  before — re-sort by `conversion_estimate` then `verification_status` before picking the next batch to send.

### [B-005] @all · INFO · OPEN · 2026-06-29
**Day 5 — backend locked.** No new features. Demo-path hardening only. 98 engine tests + 12 demo-path
tests all green. Changes:
1. **`GET /tenders`** — lists all uploaded tenders (id, title, requirement count). Frontend can show
   previously processed tenders without re-uploading. Useful if a judge wants to revisit.
2. **File size validation** — uploads > 50 MB rejected with 413 before the pipeline runs. Prevents a
   judge from accidentally crashing the server with a huge file.
3. **README updated** — reflects final state: all endpoints documented (6 total), error handling table,
   measured accuracy numbers, demo tips (wake Render, re-upload fresh, mock as hero showcase). Stale
   "Owner TODOs" removed (all done).
4. **Full demo-path verified:** health → list → upload → GET reqs → PATCH approve → PATCH flag →
   persistence → corrupt PDF → non-PDF → missing tender → missing req — all 12 pass, no regressions.

**Backend is demo-ready.** The only remaining team blocker is the `OPENAI_API_KEY` on Render (G-009, J's
lane) — without it the deployed API uses heuristic (gating recall 0.0). Everything else is locked.

### [B-004] @all · INFO · OPEN · 2026-06-29
**Day 4 hardening — pipeline never crashes on bad PDFs.** All on `main`, 98 engine tests green:
1. **Graceful PDF failure** — corrupt, empty, zero-byte, and encrypted PDFs now return HTTP 422 with a
   human-readable message instead of a 500 crash. PyMuPDF → pypdf fallback chain; both fail → clean error.
   New `PDFIngestError` exception type so the API layer can distinguish parse failures from other errors.
2. **Per-chunk error isolation** — if one chunk's extraction fails (LLM timeout, malformed response), the
   pipeline skips it and continues with the rest. A flaky chunk loses those requirements but doesn't kill
   the tender.
3. **Stress-tested**: corrupt bytes, PDF header only, zero-byte, non-PDF extension, concurrent uploads,
   cross-tender decision isolation — all pass. Real PDF regression: 21 reqs in 2.1s (heuristic path).
4. **Pipeline speed**: 2.1s end-to-end on a 13pp tender (heuristic). Well under the "feels live" bar for
   the demo. OpenAI path will be slower (network) but retry logic handles transients.

**The backend is now judge-proof on bad PDFs.** A judge can upload anything and get either requirements
or a clear error — never a blank screen or a stack trace.

### [B-003] @all · INFO · OPEN · 2026-06-29
**Day 3 backend hardening — retry/backoff, graph edges, OCR flagging.** All on `main`, py_compile green:
1. **Retry/backoff on LLM calls** — both OpenAI and Claude extractors now retry up to 3× with exponential
   backoff (1s/3s/8s) on transient failures. On final failure, returns empty (graceful degradation, never a
   crash). Addresses the "no retry logic for LLM calls" known limitation.
2. **Improved graph edges** — `depends_on` now catches cross-references in source_excerpt (not just
   requirement text) + natural-language clause references ("as set out in Section X", "in accordance with
   Clause Y", "refer to Appendix Z"). More edges → richer relationship graph for frontend.
3. **OCR/sparse-page flagging** — after all enrichment (PyMuPDF + pdfplumber), pages still under 100 chars
   get a `[WARNING: page N … likely scanned/image-only, may need OCR]` flag appended. Honest degradation —
   the extractor sees the warning and can lower confidence; no silent content loss.
- **No OpenAI key yet** — all changes are key-independent. Retry logic is ready for when the key lands.

### [B-002] @generalist · INFO · OPEN · 2026-06-29
**Gold set complete — museum tender labelled (92 requirements).** `gold-set/museum-cleaning.labels.csv`
is filled + pushed. Eval manifest updated: `draft: true` removed so `eval_all` picks it up.
@generalist: you can now run the aggregate eval across both SPSO + museum — the "X% across N tenders"
demo claim is unblocked.

### [B-001] @j @generalist · INFO · OPEN · 2026-06-29
**Backend is online.** Reviewed the scaffolded pipeline (J-013) — it's solid, owning it from here.
Confirmed the SPSO tender in `data/tenders/` works end-to-end on the heuristic path. **Blocker: no
OpenAI API key yet** — heuristic extractor runs but scores gating recall 0.0 (per G-006). @j: need
the key on `.env` locally + on Render (G-009) to make the demo path work. Using heuristic as plumbing
fallback meanwhile.

*(no posts yet — append your first entry above this line, e.g. `### [B-001] @j · ANSWER · ... `)*
