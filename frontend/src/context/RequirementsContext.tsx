"use client";

import { createContext, useContext, useState } from "react";
import type {
  CapabilityDoc,
  Requirement,
  RequirementDecision,
  RequirementStatus,
} from "@/types/requirement";
import { mockTender } from "@/data/mock-requirements";
import {
  draftAnswers as apiDraftAnswers,
  getTender,
  isApiEnabled,
  patchRequirement,
} from "@/lib/api";

const SAVE_FAILED =
  "Couldn't save that change to the server. It shows here, but may not have been kept. Check your connection, then redo it.";

interface RequirementsContextValue {
  requirements: Requirement[];
  capabilityDocs: CapabilityDoc[];
  tenderId: string | null;
  drafting: boolean;
  notice: string | null;
  dismissNotice: () => void;
  updateRequirement: (id: string, patch: Partial<Requirement>) => void;
  approve: (id: string) => void;
  editRequirement: (id: string, note: string) => void;
  flag: (id: string, note: string) => void;
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
}: {
  children: React.ReactNode;
}) {
  // Seeded from the mock so the app works with no backend (demo-safe default).
  // loadTender() swaps in a real tender when the API is wired up.
  const [requirements, setRequirements] = useState<Requirement[]>(
    () => mockTender.requirements
  );
  const [capabilityDocs, setCapabilityDocs] = useState<CapabilityDoc[]>(
    () => mockTender.capability_docs ?? []
  );
  // The live tender currently loaded (null on the mock default). Needed so the
  // autofill action knows which tender to draft against.
  const [tenderId, setTenderId] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  // A transient notice (e.g. a failed save) shown as a small toast.
  const [notice, setNotice] = useState<string | null>(null);

  function updateRequirement(id: string, patch: Partial<Requirement>) {
    setRequirements((prev) =>
      prev.map((req) => (req.id === id ? { ...req, ...patch } : req))
    );
  }

  // Replace the in-memory tender with one fetched from the live backend.
  async function loadTender(id: string) {
    const tender = await getTender(id);
    setRequirements(tender.requirements);
    setCapabilityDocs(tender.capability_docs ?? []);
    setTenderId(id);
  }

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
  // deprecated draft_answer alias in sync. (No backend endpoint yet — in-memory.)
  function editAnswer(id: string, text: string) {
    setRequirements((prev) =>
      prev.map((req) => {
        if (req.id !== id || !req.answer) return req;
        return {
          ...req,
          draft_answer: text,
          answer: { ...req.answer, text, state: "human_edited" },
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
        tenderId,
        drafting,
        updateRequirement,
        approve,
        editRequirement,
        flag,
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
    <div className="fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
      <div className="surface-grain flex max-w-md items-start gap-3 rounded-lg border border-l-2 border-hairline border-l-signal-oxblood bg-paper-raised p-3 shadow-[var(--depth-sheet)]">
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
