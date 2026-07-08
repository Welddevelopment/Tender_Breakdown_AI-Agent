import { AppMain } from "@/components/AppMain";
import { AuthGate } from "@/components/AuthGate";
import { DocumentHeader } from "@/components/DocumentHeader";
import { TendersList } from "@/components/TendersList";
import { UploadDropzone } from "@/components/UploadDropzone";

export const metadata = { title: "Tender library · Bidframe" };

export default function UploadPage() {
  return (
    <AuthGate>
      <DocumentHeader title="Tender library" showReference={false} />
      <AppMain>
        {/* One page, two halves: drop a new tender pack at the top, and the
            library of every tender you have uploaded directly beneath it —
            both visible without scrolling. */}
        <div className="mx-auto max-w-2xl pt-6">
          <UploadDropzone />
        </div>
        <section
          id="your-tenders"
          aria-label="Your tenders"
          className="mx-auto mt-10 max-w-2xl scroll-mt-24"
        >
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
            <h2 className="font-serif text-lg font-semibold leading-snug text-ink">
              Your tenders
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
              Click to reopen
            </p>
          </div>
          <div className="mt-3">
            <TendersList />
          </div>
        </section>
      </AppMain>
    </AuthGate>
  );
}
