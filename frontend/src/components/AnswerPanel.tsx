"use client";

import { useState } from "react";
import type { Requirement } from "@/types/requirement";
import { useRequirements } from "@/context/RequirementsContext";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { AnswerStateBadge } from "./AnswerStateBadge";

export function AnswerPanel({ requirement }: { requirement: Requirement }) {
  const { capabilityDocs, editAnswer } = useRequirements();
  const answer = requirement.answer ?? null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(answer?.text ?? "");

  function docName(docId: string): string {
    return capabilityDocs.find((d) => d.doc_id === docId)?.filename ?? docId;
  }

  return (
    <section className="mt-5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="font-mono text-xs font-medium uppercase tracking-wide text-ink-muted">
          Draft answer
        </h3>
        {answer && <AnswerStateBadge state={answer.state} />}
      </div>

      {!answer ? (
        <p className="rounded-lg border border-dashed border-hairline bg-paper px-3 py-3 text-sm text-ink-muted">
          No draft generated yet. The autofill step will draft a grounded answer
          for this requirement.
        </p>
      ) : editing ? (
        <div className="flex flex-col gap-2.5">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            autoFocus
            className="w-full resize-none rounded-lg border border-hairline px-3 py-2 text-sm leading-relaxed text-ink shadow-sm outline-none focus:border-forest focus:ring-1 focus:ring-forest"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                editAnswer(requirement.id, draft.trim());
                setEditing(false);
              }}
              className="inline-flex items-center rounded-lg bg-forest px-3.5 py-2 text-sm font-medium text-paper shadow-sm transition-colors hover:bg-forest-hover"
            >
              Save answer
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(answer.text);
                setEditing(false);
              }}
              className="inline-flex items-center rounded-lg bg-paper-raised px-3.5 py-2 text-sm font-medium text-ink-muted ring-1 ring-inset ring-hairline transition-colors hover:bg-paper"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-hairline bg-paper-raised px-3 py-2.5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {answer.text}
            </p>
            <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-hairline pt-2.5">
              <ConfidenceIndicator
                confidence={answer.confidence}
                needsReview={answer.state === "needs_input"}
              />
              <button
                type="button"
                onClick={() => {
                  setDraft(answer.text);
                  setEditing(true);
                }}
                className="shrink-0 text-xs font-medium text-forest transition-colors hover:text-forest-hover hover:underline"
              >
                Edit answer
              </button>
            </div>
          </div>

          <div>
            <h4 className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Evidence
            </h4>
            {answer.evidence_refs.length === 0 ? (
              <p className="rounded-lg border border-dashed border-signal-amber/30 bg-signal-amber/10 px-3 py-2 text-xs leading-relaxed text-ink">
                No supporting evidence linked yet — upload a capability document
                so this claim is backed and auditable.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {answer.evidence_refs.map((ref, index) => (
                  <li
                    key={`${ref.doc_id}-${index}`}
                    className="rounded-lg border-l-4 border-forest/40 bg-forest/5 px-3 py-2"
                  >
                    <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-forest">
                      <svg
                        className="h-3.5 w-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>{docName(ref.doc_id)}</span>
                      <span className="font-normal text-forest/70">
                        · p.{ref.page}
                      </span>
                    </div>
                    <p className="mt-1 text-xs italic leading-relaxed text-ink-muted">
                      &ldquo;{ref.excerpt}&rdquo;
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
