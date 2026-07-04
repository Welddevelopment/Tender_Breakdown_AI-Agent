import { AppMain } from "@/components/AppMain";
import { AuthGate } from "@/components/AuthGate";
import { DocumentHeader } from "@/components/DocumentHeader";
import { TendersList } from "@/components/TendersList";
import { UploadDropzone } from "@/components/UploadDropzone";

export const metadata = { title: "Tenders · Bidframe" };

export default function UploadPage() {
  return (
    <AuthGate>
      <DocumentHeader title="Your tenders" showReference={false} />
      <AppMain>
        {/* The upload entry: one prominent, centred slot as the single focal
            action, with the register of already-uploaded tenders filed
            beneath it — one page for adding a tender and reopening one. */}
        <div className="mx-auto max-w-2xl pt-10">
          <UploadDropzone />
        </div>
        <section aria-label="Your tenders" className="mx-auto mt-14 max-w-2xl">
          {/* The register's header (eyebrow, heading, live tender count) is
              rendered inside TendersList, which is the component that knows
              how many tenders actually loaded. */}
          <TendersList />
        </section>
      </AppMain>
    </AuthGate>
  );
}
