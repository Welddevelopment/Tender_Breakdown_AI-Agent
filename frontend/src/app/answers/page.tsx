import { AppMain } from "@/components/AppMain";
import { AnswersBody } from "@/components/AnswersBody";
import { DocumentHeader } from "@/components/DocumentHeader";

// Bid = the full response for the tender you're working in. Uses the app-wide
// RequirementsProvider (from the root layout), so it reflects the tender selected
// in Tender / Matrix instead of a separate frozen copy: live shows the active
// tender, demo (no API) falls back to the seeded sample. No AuthGate, so the
// Bid tab still opens instantly from the demo path. AnswersBody shows the
// "pick a tender" empty state when the app is live and none is loaded.
export const metadata = { title: "Bid response · Bidframe" };

export default function AnswersPage() {
  return (
    <div className="flex min-h-full flex-col bg-paper">
      <DocumentHeader title="Bid response" />

      <AppMain className="flex-1">
        <AnswersBody />
      </AppMain>
    </div>
  );
}
