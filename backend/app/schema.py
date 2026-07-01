"""schema.py — the locked data contract as Pydantic models.

Mirrors AGENTS.md §"Data contract" exactly (incl. the autofill extension:
answer / open_questions / capability_docs). Frontend renders this shape; do not
change it without team sign-off.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

RequirementType = Literal["mandatory", "optional"]
RequirementStatus = Literal["pending", "accepted", "edited", "flagged"]
AnswerState = Literal["auto", "needs_input", "human_edited", "empty"]


class Decision(BaseModel):
    action: str
    note: str = ""
    timestamp: str


class EvidenceRef(BaseModel):
    doc_id: str
    excerpt: str
    page: Optional[int] = None


class Answer(BaseModel):
    text: str = ""
    state: AnswerState = "empty"
    evidence_refs: list[EvidenceRef] = Field(default_factory=list)
    confidence: float = 0.0


class OpenQuestion(BaseModel):
    id: str
    question: str
    answer: Optional[str] = None
    answered_at: Optional[str] = None


class Requirement(BaseModel):
    id: str
    text: str
    source_page: int
    source_clause: Optional[str] = None
    source_excerpt: str
    type: RequirementType
    is_gating: bool
    category: str
    confidence: float                       # 0–1, display as bar/dot only
    status: RequirementStatus = "pending"
    needs_review: bool = False
    decision: Optional[Decision] = None
    criteria_ref: Optional[str] = None
    depends_on: list[str] = Field(default_factory=list)
    draft_answer: Optional[str] = None      # deprecated alias of answer.text
    answer: Optional[Answer] = None
    open_questions: list[OpenQuestion] = Field(default_factory=list)
    # Multi-file tender packs (#4): which document in the pack this came from.
    # Nullable — single-file tenders default to the one doc, so nothing breaks.
    source_doc_id: Optional[str] = None
    source_filename: Optional[str] = None


class CapabilityDoc(BaseModel):
    doc_id: str
    filename: str
    page_count: int = 0


class SourceDoc(BaseModel):
    """One document in the tender pack (#4). doc_id is stable within a tender
    (d1, d2, …) and maps to the stored PDF served for 'Open the page'."""
    doc_id: str
    filename: str
    page_count: int = 0


class Criterion(BaseModel):
    """A published award criterion (#27 — the graph needs the real name/weight,
    not just an opaque criteria_ref id). id matches Requirement.criteria_ref."""
    id: str
    name: str
    weight: int


class TenderResponse(BaseModel):
    tender_id: str
    title: str
    requirements: list[Requirement] = Field(default_factory=list)
    capability_docs: list[CapabilityDoc] = Field(default_factory=list)
    source_docs: list[SourceDoc] = Field(default_factory=list)
    award_criteria: list[Criterion] = Field(default_factory=list)


class DecisionUpdate(BaseModel):
    """PATCH body for /requirements/{id}."""
    status: Optional[RequirementStatus] = None
    decision: Optional[Decision] = None
