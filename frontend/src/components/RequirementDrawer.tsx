"use client";

import { useEffect, useRef } from "react";
import type { Requirement } from "@/types/requirement";
import { RequirementPanel } from "./RequirementPanel";

// The narrow-viewport fallback for the open state (layout.md section 5): below
// ~1100px the split is not viable, so the panel slides over the matrix as a
// drawer and the spine drops. This component is only the slide-over shell, the
// scrim, the dialog semantics, Esc-to-close, and focus, it renders the same
// RequirementPanel the split uses so the content stays identical.

interface RequirementDrawerProps {
  requirement: Requirement | null;
  onApprove: (id: string) => void;
  onEdit: (id: string, note: string) => void;
  onFlag: (id: string, note: string) => void;
  onNext: () => void;
  onClose: () => void;
}

export function RequirementDrawer({
  requirement,
  onApprove,
  onEdit,
  onFlag,
  onNext,
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
      className={`fixed inset-0 z-50 overflow-hidden ${
        open ? "" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* Scrim */}
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity ${
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
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper-raised shadow-xl outline-none transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {requirement && (
          // Keyed by id so the panel's form state resets per requirement.
          <RequirementPanel
            key={requirement.id}
            requirement={requirement}
            variant="drawer"
            onApprove={onApprove}
            onEdit={onEdit}
            onFlag={onFlag}
            onNext={onNext}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
