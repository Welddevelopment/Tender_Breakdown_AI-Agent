"use client";

import { useRef, useState } from "react";
import { useRequirements } from "@/context/RequirementsContext";
import { EvidenceLibrary } from "./EvidenceLibrary";

// Two-sided traceability: drop in the bidder's own capability docs (.pdf/.txt)
// and the API re-checks every answer against them. Secondary to the draft
// action, so this reads as a quiet panel, not a co-equal hero. The per-doc
// "backs N answers" counts live in EvidenceLibrary, rendered below — exactly
// once. In the mock default it stays visible as an honest sample-evidence
// state.
export function CapabilityUpload() {
  const { tenderId, capabilityDocs, drafting, draftAnswers } =
    useRequirements();
  const inputRef = useRef<HTMLInputElement>(null);
  const [failed, setFailed] = useState(false);

  const isSampleMode = !tenderId;

  async function onFiles(list: FileList | null) {
    if (isSampleMode) return;
    const files = list ? Array.from(list) : [];
    if (files.length === 0) return;
    setFailed(false);
    try {
      await draftAnswers("openai", files);
    } catch {
      setFailed(true);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-hairline p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Capability evidence</p>
          <p className="mt-0.5 max-w-[64ch] text-xs text-ink-muted">
            {isSampleMode
              ? "Sample tender — the answers below are backed by this sample evidence pack."
              : capabilityDocs.length > 0
              ? `Answers are backed by ${capabilityDocs.length} of your document${
                  capabilityDocs.length > 1 ? "s" : ""
                }.`
              : "Upload your capability docs so the draft is backed by your own evidence."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={drafting || isSampleMode}
          className="ui-btn shrink-0 rounded-md border border-hairline px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper-raised disabled:cursor-not-allowed disabled:opacity-60"
        >
          {drafting ? "Re-checking the evidence…" : "Add evidence docs"}
        </button>
      </div>

      {/* The per-doc library ("this doc backs N answers") — the counts' single
          home. Hides itself when no docs are loaded. */}
      <EvidenceLibrary />

      {failed && (
        <p className="mt-2 text-xs text-signal-oxblood">
          Couldn&rsquo;t upload those docs. Try again.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        multiple
        className="hidden"
        onChange={(event) => onFiles(event.target.files)}
      />
    </div>
  );
}
