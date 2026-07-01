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

from difflib import SequenceMatcher
from pathlib import Path
from typing import Callable, Optional

from .chunk import chunk_doc
from .extract import get_extractor
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
    _HAVE_ENGINE = True
except ImportError:  # pragma: no cover - deploy without engine/ on path
    _HAVE_ENGINE = False

NEEDS_REVIEW_BELOW = 0.65   # fallback threshold (used only when engine/ isn't importable)
DUP_SIMILARITY = 0.86       # fallback dedupe similarity (placeholder only)

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


def _similar(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _reconcile(raws: list[dict]) -> list[dict]:
    """Reconcile/dedupe raw extraction candidates into clean requirement dicts.

    Prefers the generalist's conservative engine (engine.reconcile): merge only on a
    high text + token + same-page + same-clause match, noisy-OR confidence, and safety
    escalation so a disqualifier is never downgraded. Falls back to a thin similarity
    dedupe only when engine/ isn't importable (e.g. a backend-rooted deploy)."""
    if _HAVE_ENGINE:
        return [_engine_merge(group) for group in _engine_group(raws)]

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
        for ch in chunks:
            try:
                bucket.extend(extractor.extract_chunk(ch))
            except Exception as exc:
                print(f"[pipeline] chunk {ch.id} (pp.{ch.page_start}-{ch.page_end}) failed ({exc}); skipping")
            done += 1
            raw_total = sum(len(v) for v in raws_by_doc.values())
            emit("extract", "Extracting requirements", 0.15 + 0.60 * (done / total),
                 done=done, total=total, raw_count=raw_total)

    # 4. Reconcile — per document (never merge a duplicate across documents), then
    #    concatenate + re-number across the whole pack.
    requirements: list[Requirement] = []
    source_docs: list[SourceDoc] = []
    full_texts: list[str] = []
    seq = 0
    for doc_id, filename, doc, _chunks in doc_chunks:
        for r in _reconcile(raws_by_doc.get(doc_id, [])):
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
