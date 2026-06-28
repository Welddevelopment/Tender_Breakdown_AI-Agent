import { UploadDropzone } from "@/components/UploadDropzone";

export const metadata = { title: "Upload — Bidframe" };

export default function UploadPage() {
  return (
    <div className="flex min-h-full flex-col bg-paper">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-16">
        <div className="mb-8 max-w-xl text-center">
          <h1 className="font-serif text-[2.125rem] font-semibold leading-[1.1] tracking-tight text-ink">
            Upload a tender
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Drop in a tender PDF and we&rsquo;ll pull out the requirements &mdash;
            deal-breakers flagged, uncertainty surfaced.
          </p>
        </div>

        <UploadDropzone />
      </main>
    </div>
  );
}
