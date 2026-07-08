"use client";

import { useEffect, useMemo, useState } from "react";
import { useRequirements } from "@/context/RequirementsContext";
import { isApiEnabled, listMembers, type TenderMember } from "@/lib/api";
import { collaboratorFor, displayName } from "@/lib/collaborators";
import {
  SOURCE_KIND_BADGE_TONE,
  sourceDocumentKindFromFilename,
  sourceKindName,
  sourceKindShortLabel,
  type SourceDocumentKind,
} from "@/lib/source-doc";
import { deriveTriage } from "@/lib/triage";

// Live decision tally for the demo shell. At rest it is one slim mono line —
// documents · requirements · deal-breakers · decision log — so the matrix stays
// above the fold; a quiet Details disclosure unfolds the full ledger (headline
// counts, the tender pack, the decision log, people) for whoever wants the
// receipts. Still explicit that every approval, edit, and flag is human-owned.
export function ControlPanel() {
  const { requirements, sourceDocs, tenderId } = useRequirements();
  const [members, setMembers] = useState<TenderMember[]>([]);

  useEffect(() => {
    if (!isApiEnabled() || !tenderId) {
      const frame = window.requestAnimationFrame(() => setMembers([]));
      return () => window.cancelAnimationFrame(frame);
    }

    let cancelled = false;
    listMembers(tenderId)
      .then((nextMembers) => {
        if (!cancelled) setMembers(nextMembers);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });

    return () => {
      cancelled = true;
    };
  }, [tenderId]);

  const s = useMemo(() => {
    const openQ = requirements.reduce(
      (n, r) => n + (r.open_questions?.filter((q) => !q.answer).length ?? 0),
      0
    );
    const accepted = requirements.filter((r) => r.status === "accepted").length;
    const edited = requirements.filter(
      (r) => r.status === "edited" || r.answer?.state === "human_edited"
    ).length;
    const flagged = requirements.filter((r) => r.status === "flagged").length;
    // What Bidframe found — the same triage the matrix groups use, so these
    // headline counts can never disagree with the register below.
    const triage = deriveTriage(requirements);
    const docs =
      sourceDocs.length > 0
        ? sourceDocs
        : Array.from(
            new Map(
              requirements
                .filter((r) => r.source_filename)
                .map((r) => [
                  r.source_filename as string,
                  {
                    doc_id: r.source_doc_id ?? r.source_filename ?? "",
                    filename: r.source_filename as string,
                    page_count: 0,
                  },
                ])
            ).values()
          );
    const sourceFiles = docs.map((doc) => {
      const kind = sourceDocumentKindFromFilename(doc.filename);
      const count = requirements.filter(
        (req) =>
          req.source_doc_id === doc.doc_id ||
          req.source_filename === doc.filename
      ).length;
      return { ...doc, kind, count };
    });
    const formatCounts = sourceFiles.reduce(
      (acc, doc) => {
        acc[doc.kind] = (acc[doc.kind] ?? 0) + 1;
        return acc;
      },
      {} as Partial<Record<SourceDocumentKind, number>>
    );
    const formatSummary = (Object.entries(formatCounts) as Array<
      [SourceDocumentKind, number]
    >)
      .map(([kind, count]) => `${count} ${sourceKindName(kind)}`)
      .join(" · ");

    const decisionsByPerson = new Map<
      string,
      {
        actor: NonNullable<(typeof requirements)[number]["decision"]>["actor"];
        approved: number;
        edited: number;
        flagged: number;
        total: number;
      }
    >();

    requirements.forEach((req) => {
      if (!req.decision) return;
      const actor = req.decision.actor ?? null;
      const key = actor?.email || actor?.id || "you";
      const bucket =
        decisionsByPerson.get(key) ??
        {
          actor,
          approved: 0,
          edited: 0,
          flagged: 0,
          total: 0,
        };
      if (req.decision.action === "approve") bucket.approved += 1;
      else if (req.decision.action === "edit") bucket.edited += 1;
      else if (req.decision.action === "flag") bucket.flagged += 1;
      bucket.total += 1;
      decisionsByPerson.set(key, bucket);
    });

    const personBreakdown = Array.from(decisionsByPerson.values())
      .sort((a, b) => b.total - a.total)
      .flatMap((person) => {
        const name = person.actor ? displayName(person.actor) : "you";
        return [
          person.approved > 0
            ? `${person.approved} approved by ${name}`
            : null,
          person.edited > 0 ? `${person.edited} edited by ${name}` : null,
          person.flagged > 0 ? `${person.flagged} flagged by ${name}` : null,
        ].filter(Boolean) as string[];
      });

    const people = new Map<
      string,
      { key: string; name: string; initials: string; color: string; role?: string }
    >();
    members.forEach((member) => {
      const collaborator = collaboratorFor(member);
      people.set(collaborator.key, {
        key: collaborator.key,
        name: collaborator.name,
        initials: collaborator.initials,
        color: collaborator.color,
        role: member.role,
      });
    });
    Array.from(decisionsByPerson.values()).forEach((person) => {
      if (!person.actor) {
        if (!people.has("you")) {
          people.set("you", {
            key: "you",
            name: "You",
            initials: "Y",
            color: "var(--color-ink-muted)",
          });
        }
        return;
      }
      const collaborator = collaboratorFor(person.actor);
      if (!people.has(collaborator.key)) {
        people.set(collaborator.key, {
          key: collaborator.key,
          name: collaborator.name,
          initials: collaborator.initials,
          color: collaborator.color,
        });
      }
    });

    return {
      total: requirements.length,
      dealBreakers: triage.counts["deal-breakers"],
      secondLook: triage.counts["second-look"],
      needsInput: triage.counts["needs-input"],
      openQ,
      accepted,
      edited,
      flagged,
      decided: accepted + edited + flagged,
      sourceFiles,
      formatSummary,
      personBreakdown,
      people: Array.from(people.values()),
    };
  }, [members, requirements, sourceDocs]);

  return (
    // Moss band = the forest-tinted chrome frame; the tally cards inside stay
    // paper (record). Completes the moss chrome stack (masthead → title → this)
    // that gives way to the pure-paper matrix below.
    <section
      aria-label="How Bidframe keeps you in control"
      className="surface-grain border-b border-moss-line bg-moss px-6 py-3 shadow-[var(--depth-row)]"
    >
      <div className="mx-auto max-w-6xl">
        {/* What Bidframe found — the headline read of the tender, above the
            human decision log. Deal-breakers carry the one earned alarm colour. */}
        <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-hairline/90 bg-paper/80 px-4 py-3 text-sm shadow-[var(--depth-pressed)] sm:grid-cols-4">
          <div>
            <dt className="text-ink-muted">Requirements found</dt>
            <dd className="mt-0.5 font-mono text-xl leading-none text-ink">
              {s.total}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Deal-breakers to clear</dt>
            <dd className="mt-0.5 font-mono text-xl leading-none text-signal-oxblood">
              {s.dealBreakers}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Worth second look</dt>
            <dd className="mt-0.5 font-mono text-xl leading-none text-ink">
              {s.secondLook}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Need your answer</dt>
            <dd className="mt-0.5 font-mono text-xl leading-none text-ink">
              {s.needsInput}
            </dd>
          </div>
        </dl>
        {s.sourceFiles.length > 0 && (
          <div className="mb-3 rounded-md border border-hairline/90 bg-paper/80 px-4 py-3 shadow-[var(--depth-pressed)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                Tender pack: {s.sourceFiles.length} document
                {s.sourceFiles.length === 1 ? "" : "s"}
              </p>
              {s.formatSummary && (
                <p className="font-mono text-[11px] text-ink-muted">
                  {s.formatSummary}
                </p>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {s.sourceFiles.map((doc) => (
                <span
                  key={doc.doc_id || doc.filename}
                  title={doc.filename}
                  className="inline-flex max-w-full items-center gap-1.5 rounded border border-hairline bg-paper-recessed px-2 py-1 font-mono text-[11px] text-ink shadow-[var(--depth-pressed)]"
                >
                  <span
                    className={`inline-flex h-4 shrink-0 items-center rounded border px-1 text-[9px] font-medium leading-none ${SOURCE_KIND_BADGE_TONE[doc.kind]}`}
                    aria-hidden
                  >
                    {sourceKindShortLabel(doc.kind)}
                  </span>
                  <span className="max-w-[18rem] truncate">{doc.filename}</span>
                  <span className="shrink-0 text-ink-muted">
                    {doc.count} req{doc.count === 1 ? "" : "s"}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
        <aside className="grid gap-3 rounded-md border border-hairline/90 bg-paper/80 px-4 py-3 shadow-[var(--depth-pressed)] lg:grid-cols-[9rem_minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
          <div className="flex items-baseline justify-between gap-3 border-b border-hairline/70 pb-2 lg:block lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
            <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Decision log
            </p>
            <span className="font-mono text-xs tabular-nums text-ink lg:mt-1 lg:block">
              {s.decided}/{s.total}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-ink-muted">Approved by user</dt>
              <dd className="mt-0.5 font-mono text-lg leading-none text-ink">
                {s.accepted}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Edited by user</dt>
              <dd className="mt-0.5 font-mono text-lg leading-none text-ink">
                {s.edited}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Flagged for colleague</dt>
              <dd className="mt-0.5 font-mono text-lg leading-none text-ink">
                {s.flagged}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Questions remaining</dt>
              <dd className="mt-0.5 font-mono text-lg leading-none text-ink">
                {s.openQ}
              </dd>
            </div>
          </dl>
          <p className="border-t border-hairline/70 pt-2 text-sm leading-relaxed text-ink-muted lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
            {s.decided === 0 ? (
              <>
                <span className="font-mono text-ink">0 approved</span> - every
                line is pending <span className="text-forest">your</span> review.
              </>
            ) : (
              <>
                <span className="font-mono text-ink">{s.decided}</span> decided
                by you ({s.accepted} approved · {s.edited} edited · {s.flagged}{" "}
                flagged) · {s.total - s.decided} still pending your review.
              </>
            )}
          </p>
        </aside>
        {(s.people.length > 0 || s.personBreakdown.length > 0) && (
          <aside className="mt-3 grid gap-3 rounded-md border border-hairline/90 bg-paper/80 px-4 py-3 shadow-[var(--depth-pressed)] lg:grid-cols-[9rem_minmax(0,1fr)_minmax(14rem,20rem)] lg:items-center">
            <div className="flex items-baseline justify-between gap-3 border-b border-hairline/70 pb-2 lg:block lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
              <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                People
              </p>
              <span className="font-mono text-xs tabular-nums text-ink lg:mt-1 lg:block">
                {s.people.length}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-ink-muted">
              {s.personBreakdown.length > 0
                ? s.personBreakdown.slice(0, 4).join(" · ")
                : "No team decisions recorded yet."}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
              {s.people.map((person) => (
                <span
                  key={person.key}
                  title={`${person.name}${person.role ? ` · ${person.role}` : ""}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-paper-recessed py-1 pl-1 pr-2 text-xs text-ink shadow-[var(--depth-pressed)]"
                >
                  <span
                    aria-hidden
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[9px] font-semibold text-paper"
                    style={{ backgroundColor: person.color }}
                  >
                    {person.initials}
                  </span>
                  <span className="max-w-[8rem] truncate">{person.name}</span>
                </span>
              ))}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
