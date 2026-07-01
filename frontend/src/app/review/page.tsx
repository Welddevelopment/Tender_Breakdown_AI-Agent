import { AuthGate } from "@/components/AuthGate";
import { MatrixView } from "@/components/MatrixView";
import { mockTender } from "@/data/mock-requirements";

// The document view: one tender filling the screen. The full-bleed header (title,
// triage line, single Next action) and the centred worklist body both live inside
// MatrixView, which owns the shared selection and filter state (layout.md sections
// 1, 2 and 8). This page is the thin shell that names the tender.
export default function ReviewPage() {
  return (
    <AuthGate>
      <MatrixView title={mockTender.title} />
    </AuthGate>
  );
}
