"""pipeline.py — ingest → chunk → extract → assemble.

Ties the steps together and turns raw per-chunk extractions into final Requirement
objects in the locked schema. Includes a DELIBERATELY THIN reconcile + confidence-route
pass so the API serves sane data today.

NOTE: proper reconcile/dedupe + confidence calibration is the GENERALIST's lane
(see role-generalist.md). What's here is a placeholder good enough to demo; the
generalist replaces `_reconcile` + `_route_confidence` with the real thing.

Scaffolded by J as backend cover.
"""

from __future__ import annotations

import os
import re
from difflib import SequenceMatcher
from pathlib import Path
from typing import Callable, Optional

from . import extract_cache
from .chunk import chunk_doc
from .extract import extract_chunk_multi, get_extractor
from .graph import build_graph
from .ingest import ingest_pdf, PDFIngestError
from .schema import (
    Answer,
    CapabilityDoc,
    Criterion,
    OpenQuestion,
    Requirement,
    SourceDoc,
    TenderResponse,
)

# The generalist's real reconcile/dedupe + confidence routing lives in the top-level
# `engine/` package (engine.reconcile). Import it when it's on the path — locally and
# from the repo root, which is the live-demo runtime + what the eval harness uses. The
# Render deploy roots at backend/ (see render.yaml), so engine/ may be absent there;
# fall back to the thin placeholders so production never breaks. To make the real engine
# live on Render too, the deploy needs engine/ on the path (J's lane — see comms G-005).
try:
    from engine.reconcile import (
        group_candidates as _engine_group,
        merge_group as _engine_merge,
        NEEDS_REVIEW_THRESHOLD as _ENGINE_NEEDS_REVIEW,
    )
    from engine.embeddings import build_index as _engine_build_index
    _HAVE_ENGINE = True
except ImportError:  # pragma: no cover - deploy without engine/ on path
    _HAVE_ENGINE = False

NEEDS_REVIEW_BELOW = 0.65   # fallback threshold (used only when engine/ isn't importable)
DUP_SIMILARITY = 0.86       # fallback dedupe similarity (placeholder only)

# Deterministic disqualifier SAFETY NET (engine.gating_scan) — an exhaustive regex scan of every
# page for pass/fail / exclusion / mandatory-return language, surfacing any gate the LLM extraction
# missed (esp. Pass/Fail selection questions that arrive as bare headings in form layouts). Same
# import-safe pattern as reconcile/answer above: present at repo-root runtime, absent on a
# backend-rooted deploy -> silently skipped. Additive + recall-first: it only ever ADDS uncovered
# gating candidates, so it can never lower recall/precision of what extraction already found.
try:
    from engine.gating_scan import (
        uncovered_gating as _engine_uncovered_gating,
        consolidate_candidates as _engine_consolidate,
    )
    _HAVE_SAFETY_NET = True
except ImportError:  # pragma: no cover - deploy without engine/ on path
    _HAVE_SAFETY_NET = False

# Stage 2 of the deal-breaker engine — the MODEL precision filter (engine.gating_filter). The net
# above is generous (recall-first); this reads each flagged line and drops obvious false positives
# (scope-of-work, boilerplate, nav) — it can only REMOVE from the net's set, so the recall floor is
# preserved. OFF unless GATING_FILTER is set + a key is present; fail-open (keeps all on any error).
try:
    from engine.gating_filter import (
        filter_gating_candidates as _engine_filter_gating,
        filter_enabled as _gating_filter_enabled,
    )
    _HAVE_GATING_FILTER = True
except ImportError:  # pragma: no cover - deploy without engine/ on path
    _HAVE_GATING_FILTER = False

# Auditable autofill (generalist steps 12-13) — engine.answer drafts a grounded answer
# per requirement (or flags needs_input). Same import-safe pattern as reconcile above:
# present when engine/ is on the path (repo-root runtime, after the render.yaml fix in
# G-009); silently skipped otherwise so a backend-rooted deploy never breaks upload.
try:
    import engine as _engine_pkg
    from engine.answer import (
        MockAnswerer as _MockAnswerer,
        draft_all as _engine_draft_all,
        load_capability_docs as _engine_load_caps,
    )
    _HAVE_ANSWER = True
    # The demo bidder's capability library (AcmeClean). Real per-tender docs come via
    # POST /tenders/{id}/draft. Folder lives next to the engine package, so it resolves
    # regardless of cwd.
    DEFAULT_CAPABILITY_DIR = Path(_engine_pkg.__file__).resolve().parent / "fixtures" / "capability"
except ImportError:  # pragma: no cover - deploy without engine/ on path
    _HAVE_ANSWER = False
    DEFAULT_CAPABILITY_DIR = None


def _extract_concurrency() -> int:
    """Parallel per-chunk extraction workers (EXTRACT_CONCURRENCY, default 1 = sequential).
    Clamped to a sane 1..16 so a stray value can't spawn a thread storm."""
    try:
        return max(1, min(16, int(os.environ.get("EXTRACT_CONCURRENCY", "1"))))
    except (TypeError, ValueError):
        return 1


def _similar(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _dedup_exact(raws: list[dict]) -> list[dict]:
    """Drop verbatim-duplicate raw candidates within one document before reconcile.

    Chunk overlap (OVERLAP_CHARS) deliberately re-reads boundary text, so a requirement that
    straddles a chunk boundary is extracted twice with identical text. Reconcile's engine only
    merges same-page + same-clause, so an overlap copy that lands on the far page survives as a
    duplicate and dents precision. This collapses candidates whose normalised text is identical,
    keeping the first (earliest page) — zero recall cost (the requirement is still there once)."""
    seen: set[str] = set()
    out: list[dict] = []
    for r in raws:
        key = " ".join((r.get("text") or "").lower().split())
        if key and key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out


def _reconcile(raws: list[dict]) -> list[dict]:
    """Reconcile/dedupe raw extraction candidates into clean requirement dicts.

    Prefers the generalist's conservative engine (engine.reconcile): merge only on a
    high text + token + same-page + same-clause match, noisy-OR confidence, and safety
    escalation so a disqualifier is never downgraded. Falls back to a thin similarity
    dedupe only when engine/ isn't importable (e.g. a backend-rooted deploy).

    Semantic (embedding) dedup is opt-in: build_index() returns None unless
    RECONCILE_SEMANTIC is set + a key is present, so this stays lexical-only by default."""
    if _HAVE_ENGINE:
        embed_index = _engine_build_index([r.get("text", "") for r in raws])
        return [_engine_merge(group) for group in _engine_group(raws, embed_index)]

    # --- fallback placeholder (engine/ not on path) ---
    kept: list[dict] = []
    for r in sorted(raws, key=lambda x: x["confidence"], reverse=True):
        dup = False
        for k in kept:
            if _similar(r["text"], k["text"]) >= DUP_SIMILARITY:
                dup = True
                break
        if not dup:
            kept.append(r)
    return kept


def _with_safety_net(reconciled: list[dict], pages) -> list[dict]:
    """Union the deterministic disqualifier safety-net onto a document's reconciled requirements.

    Appends any strong gating line the LLM extraction missed (Pass/Fail selection questions,
    exclusion grounds, mandatory returns, submission deadlines) as low-confidence, needs_review
    gating candidates — so a compliance tool can never silently drop a deal-breaker. Recall-first
    and additive: it ONLY adds uncovered gating candidates, so it can't lower recall/precision of
    what extraction found, and it never raises into the request (guarded like _autofill).

    Proven to close museum gating recall 0.7 -> 1.0 (the 3 misses g2/g61/g62 all land within the
    region-anchored semantic threshold of a net candidate); SPSO already 1.0. See comms J-068."""
    if not _HAVE_SAFETY_NET:
        return reconciled
    try:
        extra = _engine_uncovered_gating(reconciled, [(p.number, p.text) for p in pages])
        use_filter = _HAVE_GATING_FILTER and _gating_filter_enabled()
        # Recall-safe precision pass (deterministic): always drop structural non-gates. Collapse
        # near-duplicate fragments ONLY when the model filter is OFF — when it's on, the filter does
        # context-aware de-dup and the lexical dedup would degrade a gate's best candidate first.
        extra = _engine_consolidate(extra, dedup=not use_filter)
        # Stage 2: model precision filter drops obvious false flags, judging each with FULL-PAGE
        # context. Fail-open — on any error it returns `extra` unchanged, so the recall floor holds.
        if use_filter and extra:
            extra = _engine_filter_gating(extra, pages=[(p.number, p.text) for p in pages])
        return reconciled + extra
    except Exception as exc:  # safety-net is additive — never let it break the upload
        print(f"[pipeline] safety-net skipped ({exc})")
        return reconciled


def _route_confidence(req_type: str, confidence: float) -> bool:
    """Flag low-confidence items for human review (the generalist's needs_review).

    Uses the engine's threshold when available; the placeholder threshold otherwise."""
    threshold = _ENGINE_NEEDS_REVIEW if _HAVE_ENGINE else NEEDS_REVIEW_BELOW
    return confidence < threshold


def _autofill(requirements: list[Requirement], capability_folder=None, answerer=None,
              max_workers: int = 1):
    """Enrich requirements with a grounded `answer` (or an honest `needs_input` gap) drawn
    from the bidder's capability docs, plus the `capability_docs` metadata for the envelope.

    Defaults to the MockAnswerer (deterministic, free, instant — safe to run on every upload
    with no surprise LLM cost/latency); POST /tenders/{id}/draft re-runs with a real answerer
    and `max_workers > 1` so the per-requirement LLM calls run concurrently (snappy demo).
    Import-safe + never raises into the request: if engine.answer isn't on the path, or there
    are no docs, or anything fails, requirements pass through untouched."""
    if not _HAVE_ANSWER:
        return requirements, []
    folder = capability_folder or DEFAULT_CAPABILITY_DIR
    try:
        caps = _engine_load_caps(folder)
        if not caps:
            return requirements, []
        enriched, _questions = _engine_draft_all(
            [r.model_dump() for r in requirements], caps, answerer or _MockAnswerer(),
            max_workers=max_workers,
        )
        by_id = {e["id"]: e for e in enriched}
        for r in requirements:
            e = by_id.get(r.id)
            if not e:
                continue
            r.answer = Answer(**e["answer"]) if e.get("answer") else None
            r.open_questions = [OpenQuestion(**q) for q in e.get("open_questions", [])]
            r.draft_answer = e.get("draft_answer")
        caps_meta = [
            CapabilityDoc(doc_id=d["doc_id"], filename=d["filename"], page_count=1) for d in caps
        ]
        return requirements, caps_meta
    except Exception as exc:  # autofill is additive — never let it break the upload
        print(f"[pipeline] autofill skipped ({exc})")
        return requirements, []


MAX_RECTS_PER_REQ = 12   # a long multi-line excerpt; caps payload + avoids pathological hits


def _search_rects(page, excerpt: str):
    """Locate `excerpt` on a PDF page. Returns (rects, match) or (None, None). Tries the
    whole (whitespace-collapsed) excerpt first — a full-sentence highlight, match="exact" —
    then falls back to progressively shorter prefixes (first sentence, first 8 words, first
    4), which resolve a long/reflowed/OCR-normalised excerpt to at least its opening line but
    only approximately, match="approx". The frontend uses `match` to be honest: highlight the
    line confidently on "exact", show it as an approximate location on "approx"."""
    needle = " ".join(excerpt.split())
    if len(needle) < 6:
        return None, None
    full = needle[:300]
    candidates = [(full, "exact")]
    first_sentence = re.split(r"(?<=[.;:])\s", needle)[0]
    if 8 <= len(first_sentence) < len(full):
        candidates.append((first_sentence[:200], "approx"))
    words = needle.split()
    if len(words) >= 8:
        candidates.append((" ".join(words[:8]), "approx"))
    if len(words) >= 4:
        candidates.append((" ".join(words[:4]), "approx"))
    for cand, match in candidates:
        if len(cand) < 8:
            continue
        try:
            rects = page.search_for(cand)
        except Exception:
            rects = None
        if rects:
            return rects[:MAX_RECTS_PER_REQ], match
    return None, None


def _attach_source_rects(requirements: "list[Requirement]", docs: "list[tuple[str, str, str]]") -> None:
    """Fill each requirement's source_rect with the PDF bounding box(es) of its excerpt
    on its source_page (J-049 P3 — pixel-accurate highlighting for the frontend's source
    verification). Opens each document's PDF once via PyMuPDF and runs a tiered search
    (see _search_rects). Additive + fully guarded: no fitz, an unlocatable excerpt, or any
    error just leaves source_rect None (the client falls back to a text-layer search)."""
    try:
        import fitz
    except ImportError:
        return
    paths = {doc_id: path for doc_id, path, _ in docs}
    by_doc: dict[str, list] = {}
    for r in requirements:
        if r.source_doc_id:
            by_doc.setdefault(r.source_doc_id, []).append(r)
    for doc_id, reqs in by_doc.items():
        path = paths.get(doc_id)
        if not path:
            continue
        try:
            with fitz.open(path) as pdf:
                for r in reqs:
                    excerpt = (r.source_excerpt or "").strip()
                    pno = (r.source_page or 1) - 1
                    if not excerpt or pno < 0 or pno >= pdf.page_count:
                        continue
                    try:
                        rects, match = _search_rects(pdf[pno], excerpt)
                        if rects:
                            r.source_rect = [
                                [round(x.x0, 1), round(x.y0, 1), round(x.x1, 1), round(x.y1, 1)]
                                for x in rects
                            ]
                            r.source_rect_match = match
                    except Exception:
                        continue  # one bad excerpt never blocks the rest
        except Exception as exc:
            print(f"[pipeline] source_rect skipped for {doc_id} ({exc})")


def run_pipeline_multi(
    docs: "list[tuple[str, str, str]]",
    tender_id: str,
    title: str,
    on_progress: "Optional[Callable[..., None]]" = None,
) -> TenderResponse:
    """Extraction pipeline for a tender PACK (one or more PDFs) → TenderResponse.

    `docs` is a list of (doc_id, pdf_path, filename). Every document is ingested and
    extracted together, but reconciled INDEPENDENTLY so a requirement that appears in
    two documents is never wrongly merged across them; each requirement keeps accurate
    provenance (source_doc_id + source_filename + local source_page). Requirements are
    then re-numbered across the pack, the graph is built over the combined text, and
    autofill runs once.

    on_progress(stage, message, progress, **counts) streams live progress; it is
    best-effort and never breaks extraction. Stages stay monotonic across the pack
    (reading → chunking → extract → reconcile → graph → autofill) so the UI never
    appears to run backwards."""

    def emit(stage: str, message: str, progress: float, **extra) -> None:
        if on_progress is None:
            return
        try:
            on_progress(stage=stage, message=message, progress=progress, **extra)
        except Exception:  # progress is cosmetic — never let it break the pipeline
            pass

    extractor = get_extractor()
    n = max(1, len(docs))

    # 1. Reading — ingest every document (skip any that won't parse, keep the rest).
    ingested: list[tuple[str, object, str]] = []  # (doc_id, IngestedDoc, filename)
    skipped: list[str] = []
    for di, (doc_id, path, filename) in enumerate(docs):
        label = filename if n == 1 else f"{filename} ({di + 1} of {n})"
        emit("reading", f"Reading {label}", 0.05 + 0.05 * (di / n),
             doc_index=di + 1, doc_total=n)
        try:
            ingested.append((doc_id, ingest_pdf(path), filename))
        except PDFIngestError as exc:
            print(f"[pipeline] skipping {filename}: {exc}")
            skipped.append(filename)
    if not ingested:
        raise PDFIngestError("None of the uploaded documents could be read.")

    total_pages = sum(d.page_count for _, d, _ in ingested)
    emit("reading", "Reading the documents", 0.12, page_count=total_pages, doc_total=n)

    # 2. Chunking — chunk each document, remembering which document each chunk is from.
    doc_chunks: list[tuple[str, str, object, list]] = []
    total_chunks = 0
    for doc_id, doc, filename in ingested:
        chunks = chunk_doc(doc)
        doc_chunks.append((doc_id, filename, doc, chunks))
        total_chunks += len(chunks)
    emit("chunking", "Splitting into sections for careful reading", 0.15,
         page_count=total_pages, section_count=total_chunks)

    # 3. Extract — across all documents, tagging raw candidates by document.
    raws_by_doc: dict[str, list[dict]] = {}
    done = 0
    total = total_chunks or 1
    for doc_id, filename, doc, chunks in doc_chunks:
        bucket = raws_by_doc.setdefault(doc_id, [])
        # Content-addressed cache (opt-in, EXTRACT_CACHE=1): skip the LLM entirely when this
        # document's chunks + extractor identity have been extracted before. Keyed on the
        # chunk texts, so any ingest/prompt/model change auto-invalidates. See extract_cache.
        cached = extract_cache.load(chunks, extractor)
        if cached is not None:
            bucket.extend(cached)
            done += len(chunks)
            emit("extract", "Extracting requirements (cached)",
                 0.15 + 0.60 * (min(done, total) / total),
                 done=min(done, total), total=total,
                 raw_count=sum(len(v) for v in raws_by_doc.values()))
            continue
        def _one(ch):
            try:
                return extract_chunk_multi(extractor, ch)
            except Exception as exc:
                print(f"[pipeline] chunk {ch.id} (pp.{ch.page_start}-{ch.page_end}) failed ({exc}); skipping")
                return []

        # EXTRACT_CONCURRENCY>1 runs the per-chunk LLM calls on a thread pool — a big win on
        # the network-bound OpenAI path (a 40pp tender drops from minutes toward ~1/N), with
        # no benefit on the local heuristic. Default 1 = today's sequential, verified behaviour.
        # Results are collected in chunk order (executor.map preserves it) so reconcile stays
        # deterministic. Mind the key's rate limit when raising it (retry/backoff absorbs 429s).
        conc = _extract_concurrency()
        if conc > 1 and len(chunks) > 1:
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=conc) as pool:
                for res in pool.map(_one, chunks):
                    bucket.extend(res)
            done += len(chunks)
            emit("extract", "Extracting requirements", 0.15 + 0.60 * (min(done, total) / total),
                 done=min(done, total), total=total,
                 raw_count=sum(len(v) for v in raws_by_doc.values()))
        else:
            for ch in chunks:
                bucket.extend(_one(ch))
                done += 1
                emit("extract", "Extracting requirements", 0.15 + 0.60 * (done / total),
                     done=done, total=total, raw_count=sum(len(v) for v in raws_by_doc.values()))
        extract_cache.save(chunks, extractor, bucket)

    # 4. Reconcile — per document (never merge a duplicate across documents), then
    #    concatenate + re-number across the whole pack.
    requirements: list[Requirement] = []
    source_docs: list[SourceDoc] = []
    full_texts: list[str] = []
    seq = 0
    for doc_id, filename, doc, _chunks in doc_chunks:
        reconciled = _reconcile(_dedup_exact(raws_by_doc.get(doc_id, [])))
        # Safety-net: surface any disqualifier the extraction missed before we build the
        # final requirements (per-doc so provenance stays correct). Additive + guarded.
        reconciled = _with_safety_net(reconciled, doc.pages)
        for r in reconciled:
            seq += 1
            requirements.append(
                Requirement(
                    # Tender-prefixed + globally sequential so the PK is unambiguous.
                    id=f"{tender_id}-r{seq:04d}",
                    text=r["text"],
                    source_page=r["source_page"],
                    source_clause=r.get("source_clause"),
                    source_excerpt=r["source_excerpt"],
                    type=r["type"],
                    is_gating=r["is_gating"],
                    category=r["category"],
                    confidence=r["confidence"],
                    status="pending",
                    needs_review=_route_confidence(r["type"], r["confidence"]),
                    decision=None,
                    criteria_ref=None,
                    depends_on=[],
                    draft_answer=None,
                    source_doc_id=doc_id,
                    source_filename=filename,
                )
            )
        source_docs.append(SourceDoc(doc_id=doc_id, filename=filename, page_count=doc.page_count))
        full_texts.append("\n".join(p.text for p in doc.pages))
    emit("reconcile", "Merging duplicates", 0.82, requirement_count=len(requirements))

    # 5. Graph + autofill over the combined pack.
    detected_criteria = build_graph(requirements, "\n".join(full_texts))
    award_criteria = [
        Criterion(id=c["id"], name=c["name"], weight=c["weight"]) for c in detected_criteria
    ]
    deal_breakers = sum(1 for r in requirements if r.is_gating)
    emit("graph", "Mapping award criteria and flagging deal-breakers", 0.90,
         requirement_count=len(requirements), deal_breaker_count=deal_breakers)

    # Highlight coordinates for source verification (J-049 P3) — additive, guarded.
    _attach_source_rects(requirements, docs)

    requirements, capability_docs = _autofill(requirements)
    emit("autofill", "Drafting first answers from your evidence", 0.97,
         requirement_count=len(requirements), deal_breaker_count=deal_breakers)

    return TenderResponse(
        tender_id=tender_id, title=title, requirements=requirements,
        capability_docs=capability_docs, source_docs=source_docs,
        award_criteria=award_criteria,
    )


def run_pipeline(
    pdf_path: str,
    tender_id: str,
    title: str,
    on_progress: "Optional[Callable[..., None]]" = None,
) -> TenderResponse:
    """Single-document convenience wrapper over run_pipeline_multi (the pack of one)."""
    return run_pipeline_multi(
        [("d1", pdf_path, Path(pdf_path).name)],
        tender_id=tender_id,
        title=title,
        on_progress=on_progress,
    )
