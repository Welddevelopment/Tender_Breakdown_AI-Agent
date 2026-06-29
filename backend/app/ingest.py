"""ingest.py — PDF → page-numbered text.

Step 1 of the pipeline. Turns a tender PDF into a list of Page objects, each with
its 1-based page number and extracted text. Page numbers are SACRED — they're what
makes every downstream requirement verifiable against its source.

Pipeline: PyMuPDF (fitz) per page → pdfplumber fallback to recover text + TABLES on
sparse pages (form/pricing pages plain text misses) → strip repeated header/footer
noise. Falls back to pypdf if fitz isn't installed.

Backend owns further hardening (OCR for genuinely image-only pages, smarter table
rendering). Scaffolded by J.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from pathlib import Path

# A page with less than this much text is "sparse" → try pdfplumber to recover it.
SPARSE_PAGE_CHARS = 100


@dataclass
class Page:
    number: int   # 1-based page number, as a human would cite it
    text: str


@dataclass
class IngestedDoc:
    filename: str
    pages: list[Page]

    @property
    def page_count(self) -> int:
        return len(self.pages)

    @property
    def total_chars(self) -> int:
        return sum(len(p.text) for p in self.pages)

    def looks_image_only(self) -> bool:
        """True if there's almost no extractable text — likely a scan needing OCR."""
        return self.total_chars < 500 or not any(
            len(p.text.strip()) >= 100 for p in self.pages
        )


def _extract_with_fitz(pdf_path: Path) -> list[str] | None:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return None
    out: list[str] = []
    with fitz.open(str(pdf_path)) as doc:
        for page in doc:
            out.append(page.get_text("text"))
    return out


def _extract_with_pypdf(pdf_path: Path) -> list[str] | None:
    try:
        from pypdf import PdfReader
    except ImportError:
        return None
    reader = PdfReader(str(pdf_path))
    return [(page.extract_text() or "") for page in reader.pages]


def _enrich_with_pdfplumber(pdf_path: Path, pages_text: list[str]) -> list[str]:
    """Recover text on sparse pages + append TABLE content via pdfplumber.

    Tender requirements often hide in pricing/eligibility tables and on form pages
    that PyMuPDF's plain text extraction returns near-empty. pdfplumber reads both.
    No-op if pdfplumber isn't installed.
    """
    try:
        import pdfplumber
    except ImportError:
        return pages_text

    enriched = list(pages_text)
    with pdfplumber.open(str(pdf_path)) as pdf:
        for i, page in enumerate(pdf.pages):
            if i >= len(enriched):
                break
            text = enriched[i]
            if len(text.strip()) < SPARSE_PAGE_CHARS:
                recovered = page.extract_text() or ""
                if len(recovered.strip()) > len(text.strip()):
                    text = recovered
            for table in (page.extract_tables() or []):
                rows = [
                    " | ".join((cell or "").strip() for cell in row)
                    for row in table
                ]
                table_text = "\n".join(r for r in rows if r.strip())
                if table_text and table_text not in text:
                    text = f"{text}\n[table]\n{table_text}"
            enriched[i] = text
    return enriched


def _strip_headers_footers(pages_text: list[str]) -> list[str]:
    """Remove lines that repeat across many pages (running headers/footers).

    Page numbers vary per page so they survive; a banner like the tender title
    printed on every page gets stripped, cutting noise without losing content.
    """
    n = len(pages_text)
    if n < 4:
        return pages_text
    counts: Counter[str] = Counter()
    per_page_lines = []
    for text in pages_text:
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        per_page_lines.append(lines)
        for ln in lines[:2] + lines[-2:]:   # only header/footer candidates
            if len(ln) < 80:
                counts[ln] += 1
    repeated = {ln for ln, c in counts.items() if c >= max(3, int(n * 0.5))}
    if not repeated:
        return pages_text
    return ["\n".join(ln for ln in lines if ln not in repeated) for lines in per_page_lines]


def _flag_sparse_pages(pages_text: list[str]) -> list[str]:
    """Append a warning to pages that are still near-empty after all enrichment.
    These are likely scanned/image-only pages that need OCR."""
    flagged = list(pages_text)
    for i, text in enumerate(flagged):
        if len(text.strip()) < SPARSE_PAGE_CHARS:
            flagged[i] = (
                f"{text}\n[WARNING: page {i + 1} has very little extractable text "
                f"— likely scanned/image-only, may need OCR]"
            )
    return flagged


def ingest_pdf(pdf_path: str | Path, *, enrich: bool = True) -> IngestedDoc:
    """Read a PDF into page-numbered text. Raises on missing file / no PDF engine."""
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {path}")

    raw_pages = _extract_with_fitz(path)
    if raw_pages is None:
        raw_pages = _extract_with_pypdf(path)
    if raw_pages is None:
        raise RuntimeError(
            "No PDF engine available. Install one: pip install pymupdf (preferred) or pypdf"
        )

    if enrich:
        raw_pages = _enrich_with_pdfplumber(path, raw_pages)
        raw_pages = _strip_headers_footers(raw_pages)
        raw_pages = _flag_sparse_pages(raw_pages)

    pages = [Page(number=i + 1, text=text) for i, text in enumerate(raw_pages)]
    return IngestedDoc(filename=path.name, pages=pages)
