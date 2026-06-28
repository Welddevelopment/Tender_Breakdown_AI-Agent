"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { isApiEnabled, uploadTender } from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";

type UploadStage = "idle" | "extracting" | "done" | "error";

export function UploadDropzone() {
  const { loadTender } = useRequirements();
  const [stage, setStage] = useState<UploadStage>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (stage === "extracting") return;
    const file = files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStage("extracting");

    // No API configured → wireframe path (fake extraction, mock stays in place).
    if (!isApiEnabled()) {
      window.setTimeout(() => setStage("done"), 1800);
      return;
    }

    // Live path: upload the PDF, then load the extracted tender into the matrix.
    try {
      const tenderId = await uploadTender(file, file.name);
      await loadTender(tenderId);
      setStage("done");
    } catch {
      setStage("error");
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (stage === "extracting") return;
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleBrowseClick() {
    if (stage === "extracting") return;
    inputRef.current?.click();
  }

  function reset() {
    setStage("idle");
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (stage === "done") {
    return (
      <div className="w-full max-w-xl rounded-xl border border-hairline bg-paper-raised p-8 text-center shadow-sm">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-forest/10 text-forest ring-1 ring-inset ring-forest/30">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-6 w-6"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <h2 className="mt-4 text-base font-semibold tracking-tight text-ink">
          Requirements extracted
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {fileName ? (
            <>
              Parsed <span className="font-medium text-ink">{fileName}</span>{" "}
              and built the compliance matrix.
            </>
          ) : (
            "Built the compliance matrix from your tender."
          )}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-forest-hover"
          >
            View extracted requirements
            <span aria-hidden>&rarr;</span>
          </Link>
          <button
            type="button"
            onClick={reset}
            className="rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-paper hover:text-ink"
          >
            Upload another
          </button>
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="w-full max-w-xl rounded-xl border border-signal-oxblood/30 bg-paper-raised p-8 text-center shadow-sm">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-signal-oxblood/10 text-signal-oxblood ring-1 ring-inset ring-signal-oxblood/30">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v3.75m0 3.5h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            />
          </svg>
        </span>
        <h2 className="mt-4 text-base font-semibold tracking-tight text-ink">
          Couldn&rsquo;t reach the extractor
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          The backend didn&rsquo;t respond. Check it&rsquo;s running and
          reachable at <code className="text-ink">NEXT_PUBLIC_API_BASE_URL</code>, then try again.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-forest-hover"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (stage === "extracting") {
    return (
      <div className="w-full max-w-xl rounded-xl border border-hairline bg-paper-raised p-8 text-center shadow-sm">
        <span
          className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-hairline border-t-forest"
          aria-hidden
        />
        <h2 className="mt-4 text-base font-semibold tracking-tight text-ink">
          Extracting requirements&hellip;
        </h2>
        <p className="mt-1 truncate text-sm text-ink-muted" title={fileName ?? undefined}>
          {fileName}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <div
        role="button"
        tabIndex={0}
        onClick={handleBrowseClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleBrowseClick();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-16 text-center transition-colors ${
          isDragging
            ? "border-forest bg-forest/5"
            : "border-hairline bg-paper-raised hover:border-forest hover:bg-paper"
        }`}
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-paper text-ink-muted">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden
          >
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
          </svg>
        </span>
        <p className="mt-4 text-sm font-medium text-ink">
          Drop a tender PDF here, or click to browse
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          We&rsquo;ll extract every requirement into a compliance matrix.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}
