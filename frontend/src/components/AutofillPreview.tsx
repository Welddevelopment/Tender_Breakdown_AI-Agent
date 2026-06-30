"use client";

import { useRequirements } from "@/context/RequirementsContext";
import { BookDemoButton } from "@/components/landing/BookDemoButton";

// On the deployed preview (no live backend) the answers are already drafted from
// a prepared capability document. The live draft controls (AutofillButton,
// CapabilityUpload) only render once a real tender is loaded, so without this the
// autofill story would be invisible on the deployed site. Honest framing: it says
// the evidence is a prepared sample and points to a demo for your own documents.
export function AutofillPreview() {
  const { tenderId, capabilityDocs } = useRequirements();

  // A live tender uses the real draft controls instead of this preview note.
  if (tenderId) return null;

  return (
    <div className="surface-grain rounded-lg border border-hairline bg-paper-raised p-4 shadow-[var(--depth-row)]">
      <p className="text-sm font-medium text-ink">
        Drafted from your documents, every claim cited
      </p>
      <p className="mt-1 max-w-[64ch] text-sm leading-relaxed text-ink-muted">
        In this preview, Bidframe has drafted the answers from a prepared
        capability document, and each one links to the exact page it came from.
        Below are the gaps it still needs a person to fill. To draft from your own
        documents, book a short demo.
      </p>

      {capabilityDocs.length > 0 && (
        <div className="mt-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            Evidence in this preview
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {capabilityDocs.map((doc) => (
              <li
                key={doc.doc_id}
                className="rounded-md bg-paper px-2 py-0.5 font-mono text-xs text-ink-muted ring-1 ring-inset ring-hairline"
              >
                {doc.filename}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <BookDemoButton location="answers-preview" variant="link" />
      </div>
    </div>
  );
}
