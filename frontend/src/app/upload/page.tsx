import { AuthGate } from "@/components/AuthGate";
import { UploadWorkspace } from "@/components/UploadWorkspace";

export const metadata = { title: "Tender library · Bidframe" };

// A thin shell: UploadWorkspace owns the library composition AND the in-place
// upload→matrix resolve (the extracted tender mounts here, then the URL flips
// to /review without a page swap — layout.md §9's one showpiece transition).
export default function UploadPage() {
  return (
    <AuthGate>
      <UploadWorkspace />
    </AuthGate>
  );
}
