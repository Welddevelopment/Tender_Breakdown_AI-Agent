import { AppMain } from "@/components/AppMain";
import { AuthGate } from "@/components/AuthGate";
import { DocumentHeader } from "@/components/DocumentHeader";
import { UploadDropzone } from "@/components/UploadDropzone";

export const metadata = { title: "Upload · Bidframe" };

export default function UploadPage() {
  return (
    <AuthGate>
      <DocumentHeader title="Upload a tender" showReference={false} />
      <AppMain>
        {/* The upload entry: one prominent, centred slot as the single focal
            action, grounded on the blank register it files into. */}
        <div className="mx-auto max-w-2xl pt-10">
          <UploadDropzone />
        </div>
      </AppMain>
    </AuthGate>
  );
}
