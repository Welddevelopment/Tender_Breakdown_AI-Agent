"use client";

import { useRequirements } from "@/context/RequirementsContext";

// #22 (visibility half): a small library of the capability documents backing the
// drafted answers, each showing how many answers it supports — so the evidence
// reads as managed and transparent, not a black box. Works on the mock sample and
// on a live tender. (Removing a document re-runs the draft; that's a backend
// follow-up, best verified with the live answerer.)
export function EvidenceLibrary() {
  const { capabilityDocs, requirements } = useRequirements();
  if (capabilityDocs.length === 0) return null;

  // How many answers each document backs (an answer counts a doc once, even if it
  // cites it on several pages).
  const usage = new Map<string, number>();
  for (const req of requirements) {
    const refs = req.answer?.evidence_refs ?? [];
    for (const docId of new Set(refs.map((e) => e.doc_id))) {
      usage.set(docId, (usage.get(docId) ?? 0) + 1);
    }
  }

  return (
    <section className="rounded-lg border border-hairline bg-paper-raised p-4">
      <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        Your evidence
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {capabilityDocs.map((doc) => {
          const n = usage.get(doc.doc_id) ?? 0;
          return (
            <li
              key={doc.doc_id}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="min-w-0 truncate font-mono text-xs text-accent">
                {doc.filename}
              </span>
              <span className="shrink-0 font-mono text-xs text-ink-muted">
                {n > 0
                  ? `backs ${n} answer${n === 1 ? "" : "s"}`
                  : "not yet cited"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
