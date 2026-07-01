import { AppMain } from "@/components/AppMain";
import { DocumentHeader } from "@/components/DocumentHeader";
import { TendersList } from "@/components/TendersList";

export const metadata = { title: "Your tenders · Bidframe" };

export default function TendersPage() {
  return (
    <>
      <DocumentHeader title="Your tenders" />
      <AppMain>
        <p className="mb-6 max-w-[60ch] text-sm text-ink-muted">
          Every tender you have uploaded, ready to reopen where you left off.
        </p>
        <TendersList />
      </AppMain>
    </>
  );
}
