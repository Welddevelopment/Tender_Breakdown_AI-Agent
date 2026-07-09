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


class Actor(BaseModel):
    """Who made a decision (collaboration attribution). Stamped server-side from the signed-in
    user on PATCH — never trusted from the client. Additive/nullable: legacy decisions have none."""
    id: str
    email: str
    name: Optional[str] = None


class ShareRequest(BaseModel):
    """Body for POST /tenders/{id}/share — grant a registered user access to a tender."""
    email: str


class TeamCreate(BaseModel):
    """Body for POST /teams — create a persistent collaboration team."""
    name: str


class TeamMemberRequest(BaseModel):
    """Body for POST /teams/{id}/members — add a registered user to a team by email."""
    email: str


class TenderTeamRequest(BaseModel):
    """Body for POST /tenders/{id}/team — share a tender with a team (team_id=null clears it)."""
    team_id: Optional[str] = None


class CommentCreate(BaseModel):
    """Body for POST /requirements/{id}/comments — a team note on one requirement."""
    body: str


class Decision(BaseModel):
    action: str
    note: str = ""
    timestamp: str
    actor: Optional[Actor] = None


class EvidenceRef(BaseModel):
    doc_id: str
    excerpt: str
    page: Optional[int] = None


AnswerVerdict = Literal["approved", "flagged"]


class AnswerDecision(BaseModel):
    """A human verdict on the drafted answer itself — independent of the requirement's
    own status/decision. Actor stamped server-side on PATCH, never trusted from the client."""
    verdict: AnswerVerdict
    note: str = ""
    timestamp: str
    actor: Optional[Actor] = None


class Answer(BaseModel):
    text: str = ""
    state: AnswerState = "empty"
    evidence_refs: list[EvidenceRef] = Field(default_factory=list)
    confidence: float = 0.0
    # Additive: the answer-scoped verdict, absent until a human approves/flags the draft.
    decision: Optional[AnswerDecision] = None


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
    # Highlight coordinates (J-049 P3): PDF bounding box(es) of source_excerpt on
    # source_page, so the frontend can highlight the exact line instead of a best-guess
    # text search. Each rect is [x0, y0, x1, y1] in PDF points (top-left origin); a
    # multi-line excerpt yields several rects. Nullable — absent when the excerpt can't
    # be located (e.g. reflowed/OCR'd text), so the client falls back to text search.
    source_rect: Optional[list[list[float]]] = None
    # How trustworthy source_rect is: "exact" = the whole excerpt matched verbatim (highlight
    # confidently); "approx" = only a leading fragment matched, so the rect locates the
    # opening line but not the full span (show as an approximate location). None when there's
    # no rect. Lets the verification UI be honest instead of implying a perfect match.
    source_rect_match: Optional[str] = None


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


class GapAnswerUpdate(BaseModel):
    """One gap answer inside an AnswerUpdate: the open-question id and the human's text
    (null clears it). answered_at is client-supplied but optional; absent means 'now' is
    kept from the existing value."""
    id: str
    answer: Optional[str] = None
    answered_at: Optional[str] = None


class AnswerUpdate(BaseModel):
    """PATCH body for /requirements/{id}/answer — persist human-authored answer content
    (the piece with no backend home until now: answer text, gap answers, answer verdict).
    Every field is optional; only the provided ones are applied, so callers PATCH just what
    changed. The requirement's own status/decision is untouched here — that stays on
    PATCH /requirements/{id}."""
    text: Optional[str] = None
    state: Optional[AnswerState] = None
    confidence: Optional[float] = None
    open_questions: Optional[list[GapAnswerUpdate]] = None
    decision: Optional[AnswerDecision] = None   # set/replace the verdict; actor stamped server-side
    clear_decision: bool = False                # explicit reopen: verdict -> None (distinct from "unchanged")
