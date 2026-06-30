"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApiError, isApiEnabled, uploadTender } from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";

type UploadStage = "idle" | "extracting" | "done" | "error";

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function UploadDropzone() {
  const { loadTender } = useRequirements();
  const [stage, setStage] = useState<UploadStage>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // While a live extraction runs, tick an elapsed counter so a long wait on a
  // large tender reads as working, not frozen.
  useEffect(() => {
    if (stage !== "extracting" || !isApiEnabled()) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.round((Date.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  async function handleFiles(files: FileList | null) {
    if (stage === "extracting") return;
    const file = files?.[0];
    if (!file) return;
    setErrorMessage(null);

    if (files && files.length > 1) {
      setFileName(`${files.length} files`);
      setErrorMessage(
        "Upload one tender PDF at a time for this demo. Tender-pack upload is next."
      );
      setStage("error");
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setFileName(file.name);
      setErrorMessage("Use a PDF tender document. Other file types are not parsed yet.");
      setStage("error");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setFileName(file.name);
      setErrorMessage(
        "This PDF is over 50MB. The backend rejects oversized tenders before parsing."
      );
      setStage("error");
      return;
    }

    setFileName(file.name);
    setElapsed(0);
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
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "The server did not respond. Check that the API is running, then try again."
      );
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
    setErrorMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (stage === "done") {
    return (
      <div className="w-full max-w-xl">
        <h2 className="text-base font-semibold text-ink">
          Requirements extracted
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {!isApiEnabled() ? (
            <>
              Sample matrix ready. We did not parse{" "}
              <span className="font-medium text-ink">{fileName}</span> because
              no live API is configured on this deployment.
            </>
          ) : fileName ? (
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
            {isApiEnabled() ? "View extracted requirements" : "View sample matrix"}
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
          {errorMessage?.toLowerCase().includes("pdf") ||
          errorMessage?.toLowerCase().includes("50mb") ||
          errorMessage?.toLowerCase().includes("file")
            ? "We cannot parse that file yet."
            : "Couldn't complete the upload."}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {errorMessage ??
            "The server did not respond. Check it is running, then try again."}
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
    const liveWait = isApiEnabled();
    return (
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-3">
          <span
            className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-[3px] border-hairline border-t-forest"
            aria-hidden
          />
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">
              {liveWait
                ? "Extracting requirements…"
                : "Opening the sample matrix…"}
            </h2>
            <p
              className="truncate text-sm text-ink-muted"
              title={fileName ?? undefined}
            >
              {fileName}
            </p>
          </div>
        </div>
        {liveWait && (
          <p className="mt-3 text-sm text-ink-muted">
            Large tenders can take a minute or two. {formatElapsed(elapsed)}{" "}
            elapsed.
          </p>
        )}
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
          {isApiEnabled()
            ? "We'll extract every requirement into a compliance matrix."
            : "No live API is configured here, so upload opens the worked example honestly."}
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
