"use client";

import { useEffect, useRef, useState } from "react";
import type { Requirement } from "@/types/requirement";
import { useRequirements } from "@/context/RequirementsContext";
import { AnswerPanel } from "./AnswerPanel";
import { OpenQuestions } from "./OpenQuestions";

interface RequirementDrawerProps {
  requirement: Requirement | null;
  onClose: () => void;
}

type ActiveForm = "none" | "edit" | "flag";

const statusBadge: Record<string, string> = {
  pending: "bg-paper text-ink-muted ring-hairline",
  accepted: "bg-forest/10 text-forest ring-forest/30",
  edited: "bg-ink/5 text-ink ring-ink/15",
  flagged: "bg-signal-oxblood/10 text-signal-oxblood ring-signal-oxblood/30",
};

export function RequirementDrawer({
  requirement,
  onClose,
}: RequirementDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const open = requirement !== null;

  // Esc closes; focus the panel on open.
  useEffect(() => {
    if (!open) return;

    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Scrim */}
      <div
        className={`fixed inset-0 bg-ink/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Requirement detail"
        tabIndex={-1}
        className={`fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper-raised shadow-xl outline-none transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {requirement && (
          // Keyed by id so form state resets automatically per requirement.
          <DrawerContent
            key={requirement.id}
            requirement={requirement}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

function DrawerContent({
  requirement,
  onClose,
}: {
  requirement: Requirement;
  onClose: () => void;
}) {
  const { approve, editRequirement, flag } = useRequirements();
  const [activeForm, setActiveForm] = useState<ActiveForm>("none");
  const [note, setNote] = useState("");

  function handleApprove() {
    approve(requirement.id);
    onClose();
  }

  function handleSubmitForm() {
    const trimmed = note.trim();
    if (activeForm === "edit") {
      editRequirement(requirement.id, trimmed);
    } else if (activeForm === "flag") {
      flag(requirement.id, trimmed);
    }
    onClose();
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {requirement.is_gating && (
              <span className="inline-flex items-center gap-1 rounded-md bg-signal-oxblood px-2 py-0.5 text-xs font-semibold text-paper shadow-sm">
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Deal-breaker
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                statusBadge[requirement.status] ?? statusBadge.pending
              }`}
            >
              {requirement.status.charAt(0).toUpperCase() +
                requirement.status.slice(1)}
            </span>
          </div>
          <span className="text-xs text-ink-muted">{requirement.category}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 rounded-md p-1 text-ink-muted transition-colors hover:bg-paper hover:text-ink"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="text-base font-medium leading-snug text-ink">
          {requirement.text}
        </p>

        {requirement.needs_review && (
          <span className="mt-3 inline-flex w-fit items-center gap-1 rounded bg-signal-amber/15 px-1.5 py-0.5 text-[11px] font-medium text-ink">
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Tool is unsure — verify manually
          </span>
        )}

        <div className="mt-5">
          <h3 className="mb-1.5 font-mono text-xs font-medium uppercase tracking-wide text-ink-muted">
            Source excerpt
          </h3>
          <blockquote className="rounded-lg border-l-4 border-forest/30 bg-paper px-3 py-2.5 text-sm italic leading-relaxed text-ink">
            &ldquo;{requirement.source_excerpt}&rdquo;
          </blockquote>
          <div className="mt-2 flex items-center gap-2 font-mono text-xs text-ink-muted">
            <span className="font-medium text-ink">
              p.{requirement.source_page}
            </span>
            <span aria-hidden>·</span>
            <span>{requirement.source_clause}</span>
          </div>
        </div>

        <AnswerPanel requirement={requirement} />

        <OpenQuestions requirement={requirement} />

        {requirement.decision && (
          <div className="mt-5 rounded-lg border border-hairline bg-paper px-3 py-2.5">
            <h3 className="mb-1 font-mono text-xs font-medium uppercase tracking-wide text-ink-muted">
              Current decision
            </h3>
            <p className="text-sm text-ink">
              <span className="font-medium capitalize">
                {requirement.decision.action}
              </span>
              {requirement.decision.note
                ? ` — ${requirement.decision.note}`
                : ""}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-hairline px-5 py-4">
        {activeForm === "none" ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3.5 py-2 text-sm font-medium text-paper shadow-sm transition-colors hover:bg-forest-hover"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveForm("edit");
                setNote("");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-paper-raised px-3.5 py-2 text-sm font-medium text-forest ring-1 ring-inset ring-forest/30 transition-colors hover:bg-forest/5"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveForm("flag");
                setNote("");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-paper-raised px-3.5 py-2 text-sm font-medium text-signal-oxblood ring-1 ring-inset ring-signal-oxblood/30 transition-colors hover:bg-signal-oxblood/5"
            >
              Flag
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <label
              htmlFor="decision-note"
              className="font-mono text-xs font-medium uppercase tracking-wide text-ink-muted"
            >
              {activeForm === "edit" ? "Edit note" : "Reason for flagging"}
            </label>
            <textarea
              id="decision-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              autoFocus
              placeholder={
                activeForm === "edit"
                  ? "What did you change or correct?"
                  : "Why does this need attention?"
              }
              className="w-full resize-none rounded-lg border border-hairline px-3 py-2 text-sm text-ink shadow-sm outline-none focus:border-forest focus:ring-1 focus:ring-forest"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSubmitForm}
                className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium text-paper shadow-sm transition-colors ${
                  activeForm === "edit"
                    ? "bg-forest hover:bg-forest-hover"
                    : "bg-signal-oxblood hover:opacity-90"
                }`}
              >
                {activeForm === "edit" ? "Save edit" : "Flag requirement"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveForm("none");
                  setNote("");
                }}
                className="inline-flex items-center rounded-lg bg-paper-raised px-3.5 py-2 text-sm font-medium text-ink-muted ring-1 ring-inset ring-hairline transition-colors hover:bg-paper"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
