"use client";

import { useEffect, useMemo, useState } from "react";
import { useRequirements } from "@/context/RequirementsContext";
import { isApiEnabled } from "@/lib/api";
import {
  compareWeakestFirst,
  deriveReadiness,
  matchesFilters,
  type AnswerFilterKey,
} from "@/lib/answers";
import { AutofillButton } from "./AutofillButton";
import { CapabilityUpload } from "./CapabilityUpload";
import { AnswerFilterBar } from "./AnswerFilterBar";
import { AnswerWorkspace } from "./AnswerWorkspace";
import { GapInterview } from "./GapInterview";
import { ReadinessLedger } from "./ReadinessLedger";
import { NoTenderLoaded } from "./NoTenderLoaded";

// The answers response workspace. Live product with no tender loaded shows the
// onboarding empty state; otherwise: draft action + evidence upload, then the
// readiness ledger, the consolidated gap triage, the answer-centric filter/sort
// bar, and the answer cards (drafted prose + evidence receipts + inline gaps).
// The mock showcase build runs the same surface on the seeded sample.
export function AnswersBody() {
  const { requirements, seeding, capabilityDocs, tenderId, title, drafting } =
    useRequirements();
  const [active, setActive] = useState<Set<AnswerFilterKey>>(new Set());
  const [weakestFirst, setWeakestFirst] = useState(true);

  // The complete response, in the order the user is viewing it. Export and the
  // filter counts read this full list; the workspace shows the filtered slice.
  const liveSorted = useMemo(() => {
    if (!weakestFirst) return requirements; // document (source) order
    return [...requirements].sort(compareWeakestFirst);
  }, [requirements, weakestFirst]);

  // While a draft run is landing, freeze the visible order at the last settled
  // sort. Weakest-first re-ranks on every answer that lands, which would send
  // cards jumping mid-reveal; frozen, the skeletons shimmer in place and each
  // answer settles into the card that owns it. (For the demo replay the frozen
  // order equals the outcome, so the run ends without a reshuffle at all.)
  const [settledOrder, setSettledOrder] = useState<string[]>([]);
  useEffect(() => {
    if (drafting) return;
    const next = liveSorted.map((req) => req.id);
    const timer = window.setTimeout(() => {
      setSettledOrder((prev) =>
        prev.length === next.length && prev.every((id, i) => id === next[i])
          ? prev
          : next
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [drafting, liveSorted]);
  const sorted = useMemo(() => {
    if (!drafting || settledOrder.length === 0) return liveSorted;
    const position = new Map(settledOrder.map((id, i) => [id, i]));
    return [...requirements].sort(
      (a, b) =>
        (position.get(a.id) ?? Infinity) - (position.get(b.id) ?? Infinity)
    );
  }, [drafting, liveSorted, requirements, settledOrder]);

  const visible = useMemo(
    () =>
      active.size === 0
        ? sorted
        : sorted.filter((req) => matchesFilters(req, active)),
    [sorted, active]
  );

  const counts = useMemo(() => deriveReadiness(requirements), [requirements]);

  if (isApiEnabled() && !tenderId) {
    return (
      <NoTenderLoaded
        heading="No answers to draft yet"
        body="Pick a tender from the library or upload a tender pack before drafting the response."
      />
    );
  }

  // Mock demo seed still lazy-loading (milliseconds): hold an empty shell so
  // the workspace never flashes a false "no answers" state.
  if (seeding) return null;

  function selectFilter(key: AnswerFilterKey | null) {
    setActive(key ? new Set([key]) : new Set());
  }

  return (
    <>
      <p className="max-w-[64ch] text-sm text-ink-muted">
        Your response, built from your own documents &mdash; read each drafted
        answer with its evidence, and fill the gaps we still need from you.
      </p>

      {/* The draft action is the single primary action; capability upload sits
          beneath it as a quiet secondary panel. Both are workspace controls,
          not part of the printed response. */}
      <div className="no-print mt-6 flex flex-col gap-4">
        <AutofillButton />
        <CapabilityUpload />
      </div>

      <div className="mt-8">
        <ReadinessLedger
          counts={counts}
          onSelect={selectFilter}
          requirements={sorted}
          capabilityDocs={capabilityDocs}
          tenderTitle={title}
        />
      </div>

      {/* The consolidated gap triage: one line when questions remain, expanding
          to the grouped interview. Renders nothing when there are none, and is
          a workspace control, so it stays off the printed response. */}
      <div className="no-print mt-6">
        <GapInterview />
      </div>

      <div className="mt-4">
        <AnswerFilterBar
          requirements={sorted}
          capabilityDocs={capabilityDocs}
          tenderTitle={title}
          active={active}
          onSelect={selectFilter}
          weakestFirst={weakestFirst}
          onToggleSort={setWeakestFirst}
        />
      </div>

      <div className="mt-6">
        <AnswerWorkspace requirements={visible} filtered={active.size > 0} />
      </div>
    </>
  );
}
