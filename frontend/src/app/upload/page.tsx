import { UploadDropzone } from "@/components/UploadDropzone";

export const metadata = { title: "Upload — Bidframe" };

export default function UploadPage() {
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-16">
        <div className="mb-8 max-w-xl text-center">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Upload a tender
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Drop in a tender PDF and we&rsquo;ll pull out the requirements &mdash;
            deal-breakers flagged, uncertainty surfaced.
          </p>
        </div>

        <UploadDropzone />
      </main>
    </div>
  );
}
