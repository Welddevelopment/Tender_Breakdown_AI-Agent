"use client";

import { createContext, useContext, useState } from "react";
import type {
  CapabilityDoc,
  Requirement,
  RequirementDecision,
  RequirementStatus,
} from "@/types/requirement";
import { mockTender } from "@/data/mock-requirements";
import { getTender, isApiEnabled, patchRequirement } from "@/lib/api";

interface RequirementsContextValue {
  requirements: Requirement[];
  capabilityDocs: CapabilityDoc[];
  updateRequirement: (id: string, patch: Partial<Requirement>) => void;
  approve: (id: string) => void;
  editRequirement: (id: string, note: string) => void;
  flag: (id: string, note: string) => void;
  editAnswer: (id: string, text: string) => void;
  answerOpenQuestion: (
    reqId: string,
    questionId: string,
    answerText: string
  ) => void;
  loadTender: (tenderId: string) => Promise<void>;
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

  function updateRequirement(id: string, patch: Partial<Requirement>) {
    setRequirements((prev) =>
      prev.map((req) => (req.id === id ? { ...req, ...patch } : req))
    );
  }

  // Replace the in-memory tender with one fetched from the live backend.
  async function loadTender(tenderId: string) {
    const tender = await getTender(tenderId);
    setRequirements(tender.requirements);
    setCapabilityDocs(tender.capability_docs ?? []);
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
        // Best-effort: the optimistic update already reflects the change in the UI.
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
        updateRequirement,
        approve,
        editRequirement,
        flag,
        editAnswer,
        answerOpenQuestion,
        loadTender,
      }}
    >
      {children}
    </RequirementsContext.Provider>
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
