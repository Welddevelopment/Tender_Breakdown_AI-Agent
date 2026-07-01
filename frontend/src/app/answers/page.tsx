import { AppMain } from "@/components/AppMain";
import { AuthGate } from "@/components/AuthGate";
import { AutofillButton } from "@/components/AutofillButton";
import { CapabilityUpload } from "@/components/CapabilityUpload";
import { DocumentHeader } from "@/components/DocumentHeader";
import { GapInterview } from "@/components/GapInterview";

export const metadata = { title: "Answers, with receipts · Bidframe" };

export default function AnswersPage() {
  return (
    <AuthGate>
    <div className="flex min-h-full flex-col bg-paper">
      <DocumentHeader title="Answers, with receipts" />

      <AppMain className="flex-1">
        <p className="max-w-[64ch] text-sm text-ink-muted">
          Draft answers built from your own documents, plus the gaps we need you
          to fill.
        </p>

        {/* The draft action is the single primary action for this surface.
            Capability upload sits underneath it as a quiet secondary panel,
            not a co-equal hero. */}
        <div className="mt-6 flex flex-col gap-4">
          <AutofillButton />
          <CapabilityUpload />
        </div>

        <div className="mt-8">
          <GapInterview />
        </div>
      </AppMain>
    </div>
    </AuthGate>
  );
}
