"use client";

import { useState } from "react";
import type { Requirement } from "@/types/requirement";
import { useRequirements } from "@/context/RequirementsContext";
import { AnswerStateBadge } from "./AnswerStateBadge";

// The drafted-answer zone of the requirement panel (layout.md section 6). It
// lives inside the panel's measure and margin: the warm answer prose sits in a
// 64ch reading column on the left, and everything machine-ish (the answer-state
// badge, the evidence refs, the page numbers) runs down the mono margin on the
// right. The draft is provisional, so it carries at most a 2px accent edge,
// never a coloured slab. Evidence reads as "Backed by your {doc}, p.{page}" and
// expands in place to the verbatim excerpt.

export function AnswerPanel({ requirement }: { requirement: Requirement }) {
  const { capabilityDocs, editAnswer } = useRequirements();
  const answer = requirement.answer ?? null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(answer?.text ?? "");

  function docName(docId: string): string {
    return capabilityDocs.find((d) => d.doc_id === docId)?.filename ?? docId;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-0">
      {/* Prose column: the warm reading measure, left-aligned, capped at 64ch. */}
      <div className="min-w-0 flex-1 sm:pr-8">
        {!answer ? (
          <p className="max-w-[64ch] text-sm leading-relaxed text-ink-muted">
            No draft yet. Run autofill and we&rsquo;ll draft an answer from your
            documents.
          </p>
        ) : editing ? (
          <div className="flex max-w-[64ch] flex-col gap-2.5">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={5}
              autoFocus
              className="w-full resize-none border border-hairline px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  editAnswer(requirement.id, draft.trim());
                  setEditing(false);
                }}
                className="bg-forest px-3.5 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
              >
                Save answer
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(answer.text);
                  setEditing(false);
                }}
                className="px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-[64ch] border-l-2 border-forest/50 pl-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {answer.text}
            </p>
            <button
              type="button"
              onClick={() => {
                setDraft(answer.text);
                setEditing(true);
              }}
              className="mt-2 text-xs text-forest transition-colors hover:text-forest-hover hover:underline"
            >
              Edit answer
            </button>
          </div>
        )}
      </div>

      {/* Mono margin: the answer-state badge, then the evidence refs as quiet
          source lines that expand in place to the verbatim excerpt. */}
      {answer && (
        <div className="flex shrink-0 flex-col gap-3 sm:w-56 sm:border-l sm:border-hairline sm:pl-8">
          <AnswerStateBadge state={answer.state} />

          {answer.evidence_refs.length === 0 ? (
            <p className="max-w-[64ch] text-sm leading-relaxed text-ink-muted">
              No evidence linked yet. Upload a capability document so this answer
              is backed and checkable.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {answer.evidence_refs.map((ref, index) => (
                <EvidenceRefItem
                  key={`${ref.doc_id}-${index}`}
                  doc={docName(ref.doc_id)}
                  page={ref.page}
                  excerpt={ref.excerpt}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// One evidence ref in the margin: a mono "Backed by your {doc}, p.{page}" line
// that expands in place to the verbatim excerpt it came from.
function EvidenceRefItem({
  doc,
  page,
  excerpt,
}: {
  doc: string;
  page: number;
  excerpt: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="font-mono text-xs leading-relaxed">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="text-left text-accent transition-colors hover:text-ink"
      >
        Backed by your {doc}, p.{page}
      </button>
      {open && (
        <p className="mt-2 rounded bg-paper-recessed p-2.5 leading-relaxed text-accent shadow-[var(--depth-pressed)]">
          &ldquo;{excerpt}&rdquo;
        </p>
      )}
    </li>
  );
}
