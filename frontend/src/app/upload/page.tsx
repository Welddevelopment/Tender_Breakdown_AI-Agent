import { AppMain } from "@/components/AppMain";
import { DocumentHeader } from "@/components/DocumentHeader";
import { UploadDropzone } from "@/components/UploadDropzone";

export const metadata = { title: "Upload · Bidframe" };

export default function UploadPage() {
  return (
    <>
      <DocumentHeader title="Upload a tender" />
      <AppMain>
        {/* The upload entry is the one screen we centre: a single focal action,
            no worklist to anchor to a reading edge yet. */}
        <div className="mx-auto flex max-w-3xl flex-col items-center pt-6 text-center">
          <p className="mb-6 max-w-[60ch] text-sm text-ink-muted">
            Drop in a tender PDF and we&rsquo;ll pull out the requirements.
            Deal-breakers are flagged, uncertainty surfaced.
          </p>

          <UploadDropzone />
        </div>
      </AppMain>
    </>
  );
}
