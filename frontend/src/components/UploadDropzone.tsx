"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { isApiEnabled, uploadTender } from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";
import { BookDemoButton } from "@/components/landing/BookDemoButton";

type UploadStage = "idle" | "extracting" | "done" | "error";

export function UploadDropzone() {
  const { loadTender } = useRequirements();
  const [stage, setStage] = useState<UploadStage>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // With no live backend (the deployed default), there is nothing to read the
  // dropped file. Rather than imply we parsed it, the preview path opens a
  // worked example on a prepared tender and says so plainly.
  const apiEnabled = isApiEnabled();

  async function handleFiles(files: FileList | null) {
    if (stage === "extracting") return;
    const file = files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStage("extracting");

    // Preview path: no backend to read the file, so show the worked example.
    if (!apiEnabled) {
      window.setTimeout(() => setStage("done"), 1100);
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
    // Preview: be explicit that we showed a prepared example, not their file.
    if (!apiEnabled) {
      return (
        <div className="w-full max-w-xl">
          <h2 className="text-base font-semibold text-ink">
            A worked example, ready to explore
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            This preview shows Bidframe reading a prepared public-sector tender,
            not the file you dropped. To run it on your own tender, book a short
            demo.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link
              href="/review"
              className="inline-flex items-center rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
            >
              View the worked example
            </Link>
            <BookDemoButton location="upload-preview" variant="link" />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-xl">
        <h2 className="text-base font-semibold text-ink">
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
        <div className="mt-5 flex items-center gap-4">
          <Link
            href="/review"
            className="inline-flex items-center rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
          >
            View extracted requirements
          </Link>
          <button
            type="button"
            onClick={reset}
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Upload another
          </button>
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="w-full max-w-xl">
        <h2 className="text-base font-semibold text-ink">
          Couldn&rsquo;t reach the server.
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          The server didn&rsquo;t respond. Check it&rsquo;s running, then try
          again.
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (stage === "extracting") {
    return (
      <div className="flex w-full max-w-xl items-center gap-3">
        <span
          className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-[3px] border-hairline border-t-forest"
          aria-hidden
        />
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">
            {apiEnabled
              ? "Extracting requirements…"
              : "Opening a worked example…"}
          </h2>
          {apiEnabled && (
            <p
              className="truncate text-sm text-ink-muted"
              title={fileName ?? undefined}
            >
              {fileName}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl">
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
        className={`surface-grain flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-24 text-center shadow-[var(--depth-sheet)] transition-colors ${
          isDragging
            ? "border-forest bg-forest/5"
            : "border-hairline bg-paper-raised hover:border-forest hover:bg-paper"
        }`}
      >
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-paper-recessed text-ink-muted shadow-[var(--depth-pressed)]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
            aria-hidden
          >
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
          </svg>
        </span>
        <p className="mt-5 text-base font-medium text-ink">
          Drop a tender PDF here, or click to browse
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {apiEnabled
            ? "We'll extract every requirement into a compliance matrix."
            : "We'll show you a worked example on a prepared tender."}
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
