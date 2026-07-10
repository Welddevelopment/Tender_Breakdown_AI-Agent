"use client";

import { useState } from "react";
import { useRequirements } from "@/context/RequirementsContext";
import { ApiError } from "@/lib/api";
import { AnimatedNumber } from "./AnimatedNumber";

// The primary action for the answers surface. On upload the API already drafts
// answers from your documents with the free mock answerer; this re-runs the
// draft with the OpenAI answerer for precise, evidence-cited prose. In sample
// mode (no live tender) the button still works: it replays the sample tender's
// prebaked draft through the same staged landing, so the hero interaction is
// demonstrable without a backend — and stays honest, since only answers the
// seeded run actually produced are shown.
export function AutofillButton() {
  const { tenderId, drafting, draftAnswers, demoDraft, draftRun } =
    useRequirements();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSampleMode = !tenderId;

  async function run() {
    if (isSampleMode) {
      demoDraft();
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await draftAnswers("openai");
    } catch (err) {
      // The precise answerer needs an AI key on the server. When it isn't set
      // (503), fall back to the free model so drafting still produces answers,
      // and say so plainly — only a genuine connection failure is an error.
      if (err instanceof ApiError && err.status === 503) {
        try {
          await draftAnswers("mock");
          setNotice(
            "Drafted with the built-in model. Add an AI key on the server for sharper, evidence-cited prose."
          );
        } catch {
          setError("Couldn't reach the server. Try again.");
        }
      } else {
        setError("Couldn't reach the server. Try again.");
      }
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={drafting}
          aria-busy={drafting}
          className="ui-btn inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {drafting ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper"
                aria-hidden
              />
              Drafting answers from your documents&hellip;
            </>
          ) : (
            "Draft my answers"
          )}
        </button>
        {/* Mono count-up while a run plays: answers landed so far out of the
            answers this run will draft. */}
        {draftRun && draftRun.total > 0 && (
          <span aria-live="polite" className="font-mono text-xs text-ink">
            <AnimatedNumber
              value={draftRun.landed.size}
              from={0}
              className="text-forest"
            />{" "}
            of {draftRun.total} drafted
          </span>
        )}
      </div>
      {isSampleMode && !drafting && (
        <span className="max-w-[64ch] text-xs text-ink-muted">
          Sample tender &mdash; answers draft from the sample evidence pack.
        </span>
      )}
      {notice && (
        <span className="max-w-[64ch] text-xs text-ink-muted">{notice}</span>
      )}
      {error && (
        <span className="text-xs text-signal-oxblood">{error}</span>
      )}
    </div>
  );
}
