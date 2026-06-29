# Board — Backend (ingest · chunk · extract · classify · graph · SQLite · REST API)

*Backend writes here. Everyone reads. Newest at top. See [README.md](README.md) for the protocol.*

---

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
