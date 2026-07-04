"use client";

import { useMemo } from "react";
import { useRequirements } from "@/context/RequirementsContext";

// Makes Bidframe's "user stays in control" model VISIBLE (the Conduct track's thesis:
// the expert stays at the wheel). Two things a judge can see at a glance:
//   1. The activity trail — what the agent DID (read → found → flagged → drafted) and,
//      crucially, what it LEFT for the human, with a live decision tally that updates as
//      you approve / edit / flag.
//   2. The control contract — the explicit LIMITS: it drafts, it never decides; nothing
//      is approved or submitted without you.
// Reads live from the requirements context. Rendered on /showcase; designed to fold into
// the shared product shell (MatrixView's header) so /review shows it too — see J's note.
export function ControlPanel() {
  const { requirements, sourceDocs } = useRequirements();

  const s = useMemo(() => {
    const pagesFromDocs = sourceDocs.reduce(
      (total, doc) => total + (doc.page_count ?? 0),
      0
    );
    const pages =
      pagesFromDocs ||
      requirements.reduce((m, r) => Math.max(m, r.source_page ?? 0), 0);
    const gating = requirements.filter((r) => r.is_gating).length;
    const answered = requirements.filter((r) => r.answer?.state === "auto").length;
    const openQ = requirements.reduce(
      (n, r) => n + (r.open_questions?.filter((q) => !q.answer).length ?? 0),
      0
    );
    const accepted = requirements.filter((r) => r.status === "accepted").length;
    const edited = requirements.filter((r) => r.status === "edited").length;
    const flagged = requirements.filter((r) => r.status === "flagged").length;
    return {
      pages,
      total: requirements.length,
      gating,
      answered,
      openQ,
      accepted,
      edited,
      flagged,
      decided: accepted + edited + flagged,
    };
  }, [requirements, sourceDocs]);

  const step = (n: string | number, label: string) => (
    <li className="flex items-baseline gap-1.5">
      <span className="font-mono text-sm tabular-nums text-ink">{n}</span>
      <span className="text-ink-muted">{label}</span>
    </li>
  );

  return (
    <section
      aria-label="How Bidframe keeps you in control"
      className="surface-grain border-b border-hairline bg-paper-raised/70 px-6 py-3 shadow-[var(--depth-row)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2.5">
        {/* Activity trail: what the agent did → what it left for you */}
        <ol className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-hairline/80 pb-2 font-mono text-[11px] uppercase tracking-[0.08em]">
          {step(s.pages, "pages read")}
          <span aria-hidden className="text-ink-muted/50">→</span>
          {step(s.total, "requirements found")}
          <span aria-hidden className="text-ink-muted/50">→</span>
          {step(s.gating, "deal-breakers flagged")}
          <span aria-hidden className="text-ink-muted/50">→</span>
          {step(s.answered, "answers drafted from your evidence")}
          <span aria-hidden className="text-ink-muted/50">→</span>
          {step(s.openQ, "left for you to answer")}
        </ol>

        {/* Decision tally — the "nothing is autonomous" proof, updates live */}
        <p className="text-sm text-ink-muted">
          {s.decided === 0 ? (
            <>
              <span className="font-mono text-ink">0 approved</span> — every line is
              pending <span className="text-forest">your</span> review.
            </>
          ) : (
            <>
              <span className="font-mono text-ink">{s.decided}</span> decided by you (
              {s.accepted} approved · {s.edited} edited · {s.flagged} flagged) ·{" "}
              {s.total - s.decided} still pending your review.
            </>
          )}
        </p>

        {/* The control contract — explicit limits on the agent */}
        <p className="max-w-4xl text-xs leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">You&rsquo;re at the wheel.</span>{" "}
          Bidframe reads and drafts — it never decides. Every deal-breaker is flagged for
          your sign-off, answers are drafted only from <em>your</em> evidence, it asks
          when it can&rsquo;t, and it shows its confidence rather than hiding it. Nothing
          is approved or submitted until you say so.
        </p>
      </div>
    </section>
  );
}
