"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Requirement } from "@/types/requirement";
import {
  isConfidentNonGating,
  labelForRequirementAction,
  orderedWorklist,
  type Triage,
} from "@/lib/triage";
import { RequirementPanel } from "./RequirementPanel";

// Focus mode: a full-screen, one-requirement-at-a-time review flow over the
// pending-first worklist (lib/triage.ts orderedWorklist). An overlay, not a
// route — it follows the SourceVerifyOverlay pattern (fixed sheet, scroll lock,
// Esc, focus) and renders the same RequirementPanel in its "focus" register.
// Decisions arrive as the SAME wrapped handlers MatrixView already uses, so
// every one carries its undo toast; after a decision the flow auto-advances to
// the next pending item, and an emptied worklist earns a quiet completion note.

interface FocusModeProps {
  triage: Triage;
  onApprove: (id: string) => void;
  onEdit: (id: string, note: string) => void;
  onFlag: (id: string, note: string) => void;
  onClose: () => void;
}

export function FocusMode({
  triage,
  onApprove,
  onEdit,
  onFlag,
  onClose,
}: FocusModeProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // The live walking order: pending first, in triage group order. Recomputed as
  // decisions land, so "next pending" is always honest.
  const worklist = orderedWorklist(triage);
  const all = triage.groups.flatMap((group) => group.items);
  const pendingCount = all.filter((req) => req.status === "pending").length;

  // The session rail: the worklist as it stood on entry, frozen (lazy useState,
  // initialised once on mount) so "m of n" and the progress track measure THIS
  // sitting, not a moving target.
  const [rail] = useState<string[]>(() => worklist.map((req) => req.id));

  const byId = new Map<string, Requirement>(all.map((req) => [req.id, req]));
  const [currentId, setCurrentId] = useState<string | null>(
    () => worklist[0]?.id ?? null
  );
  const current = currentId ? (byId.get(currentId) ?? null) : null;

  const position = currentId ? rail.indexOf(currentId) + 1 : 0;
  const doneCount = rail.filter(
    (id) => byId.get(id)?.status !== "pending"
  ).length;

  // Move through the live worklist. A decided current item has left the
  // pending-first list, so an unfound index falls back to the first item.
  const move = useCallback(
    (delta: number) => {
      if (worklist.length === 0) return;
      const idx = worklist.findIndex((req) => req.id === currentId);
      if (idx === -1) {
        setCurrentId(worklist[0].id);
        return;
      }
      const next = Math.min(worklist.length - 1, Math.max(0, idx + delta));
      setCurrentId(worklist[next].id);
    },
    [worklist, currentId]
  );

  // After a decision, advance to the next still-pending item: forward from the
  // decided one first, wrapping to the top. Computed from the pre-decision
  // worklist (the handler's state update lands next render).
  const advanceFrom = useCallback(
    (id: string) => {
      const idx = worklist.findIndex((req) => req.id === id);
      const start = idx === -1 ? 0 : idx + 1;
      const around = [...worklist.slice(start), ...worklist.slice(0, start)];
      const next = around.find(
        (req) => req.status === "pending" && req.id !== id
      );
      if (next) setCurrentId(next.id);
    },
    [worklist]
  );

  const approveAndAdvance = useCallback(
    (id: string) => {
      onApprove(id);
      advanceFrom(id);
    },
    [onApprove, advanceFrom]
  );

  const editAndAdvance = useCallback(
    (id: string, note: string) => {
      onEdit(id, note);
      advanceFrom(id);
    },
    [onEdit, advanceFrom]
  );

  const flagAndAdvance = useCallback(
    (id: string, note: string) => {
      onFlag(id, note);
      advanceFrom(id);
    },
    [onFlag, advanceFrom]
  );

  // Overlay chrome: focus the sheet on entry and lock the page scroll behind it
  // (the matrix stays where it was for the return).
  useEffect(() => {
    dialogRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Keyboard: Esc exits; j/k and the arrows walk the worklist; `a` approves a
  // confident non-gating item (a gating one still needs the panel's named
  // confirm). e/f are handled inside the panel's decision zone (variant
  // "focus"), dropping straight into the note flow.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      const el = event.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (
        event.key === "j" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
        move(1);
      } else if (
        event.key === "k" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();
        move(-1);
      } else if (event.key === "a" && current) {
        if (isConfidentNonGating(current)) {
          event.preventDefault();
          approveAndAdvance(current.id);
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, move, current, approveAndAdvance]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Focus review"
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex flex-col bg-paper outline-none"
    >
      {/* The slim progress rail: where you are in this sitting, in mono, over a
          forest track of how much of the entry worklist is decided. */}
      <div className="border-b border-hairline bg-paper-raised px-5 py-3 sm:px-8">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-xs text-ink-muted">
            Focus review
            {position > 0 && (
              <>
                {" · "}
                <span className="text-ink">
                  {position} of {rail.length}
                </span>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs text-ink-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
          >
            Close (Esc)
          </button>
        </div>
        <div
          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-hairline"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={rail.length}
          aria-valuenow={doneCount}
          aria-label="Requirements decided this sitting"
        >
          <div
            className="h-full rounded-full bg-forest transition-[width] duration-500"
            style={{
              width: `${rail.length > 0 ? (doneCount / rail.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-[980px] flex-1 flex-col px-4 py-5 sm:px-8 sm:py-8">
        {pendingCount === 0 ? (
          <FocusComplete total={rail.length} onExit={onClose} />
        ) : current ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-hairline shadow-[var(--depth-sheet)]">
            <RequirementPanel
              key={current.id}
              requirement={current}
              variant="focus"
              onApprove={approveAndAdvance}
              onEdit={editAndAdvance}
              onFlag={flagAndAdvance}
              onNext={() => move(1)}
              nextLabel={labelForRequirementAction(
                worklist[
                  Math.min(
                    worklist.length - 1,
                    worklist.findIndex((req) => req.id === currentId) + 1
                  )
                ]
              )}
              onClose={onClose}
            />
          </div>
        ) : null}
        <p className="mt-4 shrink-0 font-mono text-[11px] text-ink-muted/70">
          Keys: j / k to move, a to approve a confident item, e to edit, f to
          flag, Esc to exit.
        </p>
      </div>
    </div>
  );
}

// The worklist ran dry mid-focus: a quiet completion note, not a celebration —
// the earned stamp and the export live on the matrix behind this overlay.
function FocusComplete({
  total,
  onExit,
}: {
  total: number;
  onExit: () => void;
}) {
  return (
    <div className="surface-grain flex flex-1 flex-col items-center justify-center rounded-lg border border-hairline bg-paper-raised px-6 py-10 text-center shadow-[var(--depth-sheet)]">
      <p className="font-mono text-xs font-medium uppercase tracking-wide text-ink-muted">
        Review complete
      </p>
      <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight text-ink">
        Nothing left to review
      </h2>
      <p className="mt-2 max-w-[44ch] font-mono text-xs leading-relaxed text-ink-muted">
        Every one of the {total} requirement{total === 1 ? "" : "s"} in this
        sitting has a decision on it.
      </p>
      <button
        type="button"
        onClick={onExit}
        className="mt-6 bg-forest px-4 py-2 text-sm font-semibold text-paper shadow-[var(--depth-control)] transition-colors hover:bg-forest-hover"
      >
        Exit focus
      </button>
    </div>
  );
}
