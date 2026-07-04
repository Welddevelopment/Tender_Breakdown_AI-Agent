import type { Tender } from "@/types/requirement";
import { AppMain } from "@/components/AppMain";
import { AnswersBody } from "@/components/AnswersBody";
import { DocumentHeader } from "@/components/DocumentHeader";
import { RequirementsProvider } from "@/context/RequirementsContext";
import bradwellPrebake from "@/data/bradwell-prebake.json";

// Demo-locked like /showcase: the answers workspace runs on the SAME frozen
// Bradwell run as the stage walkthrough (no AuthGate, no backend, no key), so
// following "Answers" from the showcase never lands on mock data.
const demoTender = bradwellPrebake as unknown as Tender;

export const metadata = { title: "Answers, with receipts · Bidframe" };

export default function AnswersPage() {
  return (
    <RequirementsProvider initialTender={demoTender}>
      <div className="flex min-h-full flex-col bg-paper">
        <DocumentHeader title="Answers, with receipts" />

        <AppMain className="flex-1">
          <AnswersBody />
        </AppMain>
      </div>
    </RequirementsProvider>
  );
}
