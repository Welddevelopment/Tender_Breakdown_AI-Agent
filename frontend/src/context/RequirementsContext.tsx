"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type {
  AwardCriterion,
  CapabilityDoc,
  Requirement,
  RequirementDecision,
  RequirementStatus,
  Tender,
} from "@/types/requirement";
import { mockTender } from "@/data/mock-requirements";
import {
  draftAnswers as apiDraftAnswers,
  getTender,
  isApiEnabled,
  patchRequirement,
} from "@/lib/api";
import {
  loadAnswerStore,
  mergeStoreIntoRequirements,
  projectStore,
  saveAnswerStore,
} from "@/lib/answer-store";

const SAVE_FAILED =
  "Couldn't save that change to the server. It shows here, but may not have been kept. Check your connection, then redo it.";

// The undo seam for batch decisions: what to capture before a bulk change so it
// can be put back exactly (status + recorded decision), one entry per id.
export interface DecisionSnapshot {
  id: string;
  status: RequirementStatus;
  decision: RequirementDecision | null;
}

interface RequirementsContextValue {
  requirements: Requirement[];
  capabilityDocs: CapabilityDoc[];
  awardCriteria: AwardCriterion[];
  title: string;
  tenderId: string | null;
  drafting: boolean;
  notice: string | null;
  dismissNotice: () => void;
  updateRequirement: (id: string, patch: Partial<Requirement>) => void;
  approve: (id: string) => void;
  editRequirement: (id: string, note: string) => void;
  flag: (id: string, note: string) => void;
  approveMany: (ids: string[]) => void;
  flagMany: (ids: string[], note: string) => void;
  snapshotDecisions: (ids: string[]) => DecisionSnapshot[];
  restoreDecisions: (snapshot: DecisionSnapshot[]) => void;
  reopen: (id: string) => void;
  editAnswer: (id: string, text: string) => void;
  answerOpenQuestion: (
    reqId: string,
    questionId: string,
    answerText: string
  ) => void;
  loadTender: (tenderId: string) => Promise<void>;
  draftAnswers: (provider?: "openai" | "mock", files?: File[]) => Promise<void>;
}

const RequirementsContext = createContext<RequirementsContextValue | null>(null);

export function RequirementsProvider({
  children,
  initialTender,
}: {
  children: React.ReactNode;
  // Freeze the provider on a specific tender instead of the mock. The read-only
  // /demo showcase passes the pre-baked SPSO run here so it shows a real tender
  // with no backend or API key, independent of the app's live/mock state.
  initialTender?: Tender;
}) {
  // Seeded from the mock so the app works with no backend (demo-safe default),
  // or from initialTender when a caller freezes it on a specific tender.
  // loadTender() swaps in a real tender when the API is wired up.
  const seed = initialTender ?? mockTender;
  const [requirements, setRequirements] = useState<Requirement[]>(
    () => seed.requirements
  );
  const [capabilityDocs, setCapabilityDocs] = useState<CapabilityDoc[]>(
    () => seed.capability_docs ?? []
  );
  // The tender's published award criteria (name + weight, #27) — the matrix
  // lens and the graph both read real names + weights from here. Empty until
  // the tender publishes them; refreshed alongside requirements on load/draft.
  const [awardCriteria, setAwardCriteria] = useState<AwardCriterion[]>(
    () => seed.award_criteria ?? []
  );
  // The live tender currently loaded (null on the mock default). Needed so the
  // autofill action knows which tender to draft against.
  const [tenderId, setTenderId] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  // A transient notice (e.g. a failed save) shown as a small toast.
  const [notice, setNotice] = useState<string | null>(null);

  // Where the answers response workspace persists a human's draft edits + gap
  // answers (localStorage; there's no backend endpoint for answer text yet). Key
  // by the live tender when one is loaded, else the seed's id so the mock/demo
  // build keeps edits across a refresh. A frozen /demo showcase (initialTender)
  // stays read-only: null disables persistence entirely.
  const persistKey = tenderId ?? (initialTender ? null : seed.tender_id);

  function updateRequirement(id: string, patch: Partial<Requirement>) {
    setRequirements((prev) =>
      prev.map((req) => (req.id === id ? { ...req, ...patch } : req))
    );
  }

  // Replace the in-memory tender with one fetched from the live backend.
  async function loadTender(id: string) {
    const tender = await getTender(id);
    // Merge any locally-saved answer edits + gap answers for this tender back
    // over the fresh server data (evidence and machine fields stay from the API).
    setRequirements(
      mergeStoreIntoRequirements(tender.requirements, loadAnswerStore(id))
    );
    setCapabilityDocs(tender.capability_docs ?? []);
    setAwardCriteria(tender.award_criteria ?? []);
    setTenderId(id);
    try {
      window.sessionStorage.setItem("bf-tender", id);
    } catch {
      // sessionStorage unavailable (private mode) — refresh-restore just won't work.
    }
  }

  // #28: restore the last live tender on a refresh — its decisions come back too,
  // since the backend persists them. sessionStorage keeps it tab-scoped (cleared
  // when the tab closes). The mock/demo (no API) is unaffected.
  useEffect(() => {
    // A seeded demo is frozen — never override it with a live/restored tender,
    // even when NEXT_PUBLIC_API_BASE_URL is set on the hosted build.
    if (initialTender) return;
    if (!isApiEnabled()) return;
    let saved: string | null = null;
    try {
      saved = window.sessionStorage.getItem("bf-tender");
    } catch {
      saved = null;
    }
    if (saved) {
      // Async restore: loadTender awaits the fetch before setting any state, so this
      // is not a synchronous cascading render (the rule can't see past the await).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadTender(saved).catch(() => {
        try {
          window.sessionStorage.removeItem("bf-tender");
        } catch {
          /* ignore */
        }
      });
    }
  }, [initialTender]);

  // Restore locally-saved answer edits for the mock/demo default. The live app
  // restores through loadTender (keyed by the live tender id) instead, and a
  // frozen /demo showcase stays read-only. Runs once on mount.
  useEffect(() => {
    if (initialTender || isApiEnabled()) return;
    const stored = loadAnswerStore(seed.tender_id);
    if (Object.keys(stored).length === 0) return;
    // Synchronous merge over the seed on mount; deps are intentionally empty so
    // it runs exactly once (mirrors the sessionStorage restore above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRequirements((prev) => mergeStoreIntoRequirements(prev, stored));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the human-mutable subset (edited/written answers + gap answers)
  // whenever requirements change. No-op when persistence is disabled (frozen
  // demo) or on the server.
  useEffect(() => {
    saveAnswerStore(persistKey, projectStore(requirements));
  }, [requirements, persistKey]);

  // Auditable autofill: ask the API to (re)draft grounded answers for the loaded
  // tender, optionally against freshly-uploaded capability docs, then swap the enriched
  // requirements + capability docs into the UI.
  async function draftAnswers(provider: "openai" | "mock" = "openai", files?: File[]) {
    if (!tenderId || !isApiEnabled()) return;
    setDrafting(true);
    try {
      const tender = await apiDraftAnswers(tenderId, { provider, files });
      setRequirements(tender.requirements);
      setCapabilityDocs(tender.capability_docs ?? []);
      setAwardCriteria(tender.award_criteria ?? []);
    } finally {
      setDrafting(false);
    }
  }

  // Optimistic in-memory update + best-effort persistence to the API when wired.
  function applyDecision(
    id: string,
    status: RequirementStatus,
    decision: RequirementDecision
  ) {
    updateRequirement(id, { status, decision });
    if (isApiEnabled()) {
      patchRequirement(id, { status, decision }).catch(() => {
        setNotice(SAVE_FAILED);
      });
    }
  }

  // The batch counterpart of applyDecision: one setRequirements pass for the
  // whole set (a single render, however many rows), then the same optimistic
  // fire-and-forget per-id PATCH when the API is wired.
  function applyDecisionMany(
    ids: string[],
    status: RequirementStatus,
    decision: RequirementDecision
  ) {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setRequirements((prev) =>
      prev.map((req) => (idSet.has(req.id) ? { ...req, status, decision } : req))
    );
    if (isApiEnabled()) {
      for (const id of ids) {
        patchRequirement(id, { status, decision }).catch(() => {
          setNotice(SAVE_FAILED);
        });
      }
    }
  }

  function approveMany(ids: string[]) {
    applyDecisionMany(ids, "accepted", {
      action: "approve",
      note: "",
      timestamp: new Date().toISOString(),
    });
  }

  function flagMany(ids: string[], note: string) {
    applyDecisionMany(ids, "flagged", {
      action: "flag",
      note,
      timestamp: new Date().toISOString(),
    });
  }

  // Undo seam for batch decisions: capture status + decision for a set of ids
  // BEFORE a bulk change, and put a captured snapshot back afterwards. Restore
  // is one setState pass + the usual per-id PATCH. State mechanics only — the
  // toast/undo UI lives with the caller.
  function snapshotDecisions(ids: string[]): DecisionSnapshot[] {
    const idSet = new Set(ids);
    return requirements
      .filter((req) => idSet.has(req.id))
      .map((req) => ({ id: req.id, status: req.status, decision: req.decision }));
  }

  function restoreDecisions(snapshot: DecisionSnapshot[]) {
    if (snapshot.length === 0) return;
    const byId = new Map(snapshot.map((entry) => [entry.id, entry]));
    setRequirements((prev) =>
      prev.map((req) => {
        const entry = byId.get(req.id);
        return entry
          ? { ...req, status: entry.status, decision: entry.decision }
          : req;
      })
    );
    if (isApiEnabled()) {
      for (const entry of snapshot) {
        patchRequirement(entry.id, {
          status: entry.status,
          decision: entry.decision,
        }).catch(() => {
          setNotice(SAVE_FAILED);
        });
      }
    }
  }

  function approve(id: string) {
    applyDecision(id, "accepted", {
      action: "approve",
      note: "",
      timestamp: new Date().toISOString(),
    });
  }

  function editRequirement(id: string, note: string) {
    applyDecision(id, "edited", {
      action: "edit",
      note,
      timestamp: new Date().toISOString(),
    });
  }

  function flag(id: string, note: string) {
    applyDecision(id, "flagged", {
      action: "flag",
      note,
      timestamp: new Date().toISOString(),
    });
  }

  // Undo a decision: return the requirement to pending and clear the recorded
  // decision. Optimistic in-memory, best-effort persistence like applyDecision.
  function reopen(id: string) {
    updateRequirement(id, { status: "pending", decision: null });
    if (isApiEnabled()) {
      patchRequirement(id, { status: "pending", decision: null }).catch(() => {
        setNotice(SAVE_FAILED);
      });
    }
  }

  // Human revises the drafted answer — record it as human-edited and keep the
  // deprecated draft_answer alias in sync. When no answer exists yet (a
  // requirement the autofill left blank), CREATE one from the human's text so
  // it can be drafted from scratch here. A hand-written answer carries no
  // evidence refs, so it honestly reads as unbacked until backed. (No backend
  // endpoint yet — in-memory + localStorage.)
  function editAnswer(id: string, text: string) {
    setRequirements((prev) =>
      prev.map((req) => {
        if (req.id !== id) return req;
        const base = req.answer ?? {
          text: "",
          state: "empty" as const,
          evidence_refs: [],
          confidence: 0.5,
        };
        return {
          ...req,
          draft_answer: text,
          answer: {
            ...base,
            text,
            state: "human_edited",
            confidence: Math.max(base.confidence, 0.7),
          },
        };
      })
    );
  }

  // Human answers a gap question the tool flagged. (No backend endpoint yet — in-memory.)
  function answerOpenQuestion(
    reqId: string,
    questionId: string,
    answerText: string
  ) {
    setRequirements((prev) =>
      prev.map((req) => {
        if (req.id !== reqId || !req.open_questions) return req;
        return {
          ...req,
          open_questions: req.open_questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answer: answerText,
                  answered_at: new Date().toISOString(),
                }
              : q
          ),
        };
      })
    );
  }

  return (
    <RequirementsContext.Provider
      value={{
        requirements,
        capabilityDocs,
        awardCriteria,
        title: seed.title,
        tenderId,
        drafting,
        updateRequirement,
        approve,
        editRequirement,
        flag,
        approveMany,
        flagMany,
        snapshotDecisions,
        restoreDecisions,
        reopen,
        editAnswer,
        answerOpenQuestion,
        loadTender,
        draftAnswers,
        notice,
        dismissNotice: () => setNotice(null),
      }}
    >
      {children}
      {notice && (
        <SaveNotice message={notice} onDismiss={() => setNotice(null)} />
      )}
    </RequirementsContext.Provider>
  );
}

// A small, dismissible toast pinned to the bottom of the viewport. The oxblood
// reading edge marks it as a problem without a coloured slab (the status system).
function SaveNotice({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="no-print fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
      <div className="surface-grain flex max-w-md items-start gap-3 rounded-lg border border-l-2 border-hairline border-l-signal-oxblood-frame bg-paper-raised p-3 shadow-[var(--depth-sheet)]">
        <p className="text-sm leading-snug text-ink">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-xs text-ink-muted transition-colors hover:text-ink"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function useRequirements(): RequirementsContextValue {
  const context = useContext(RequirementsContext);
  if (context === null) {
    throw new Error(
      "useRequirements must be used within a RequirementsProvider"
    );
  }
  return context;
}
