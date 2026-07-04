"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getJob,
  isApiEnabled,
  uploadTender,
  type JobStatus,
} from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";
import {
  sourceDocumentKindFromFilename,
  sourceKindShortLabel,
} from "@/lib/source-doc";
import { ProcessingView } from "./ProcessingView";

type UploadStage = "idle" | "extracting" | "done" | "error";

const ACCEPTED_TENDER_EXTENSIONS = [".pdf", ".docx", ".xlsx", ".csv", ".zip"];
const ACCEPTED_TENDER_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
]);
const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;
const MAX_ZIP_BYTES = 200 * 1024 * 1024;

function isAcceptedTenderFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    ACCEPTED_TENDER_MIME.has(file.type) ||
    ACCEPTED_TENDER_EXTENSIONS.some((ext) => name.endsWith(ext))
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)}MB`;
}

function uploadKindShortLabel(file: File): string {
  if (isZipPack(file)) return "ZIP";
  return sourceKindShortLabel(sourceDocumentKindFromFilename(file.name));
}

function packLabel(files: File[]): string | null {
  if (files.length === 0) return null;
  if (files.length === 1) return files[0].name;
  return `${files.length} documents`;
}

function packDoneLabel(files: File[]): string {
  if (files.length === 1) return files[0].name;
  return `${files.length} documents`;
}

function isZipPack(file: File | undefined): boolean {
  return Boolean(file?.name.toLowerCase().endsWith(".zip"));
}

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

// Poll a background extraction job until it finishes, pushing each update to the
// UI so the ProcessingView can show live progress. Resolves on done or error;
// throws only on a network/HTTP failure (surfaced by the caller).
async function pollJob(
  jobId: string,
  onUpdate: (job: JobStatus) => void
): Promise<JobStatus> {
  for (;;) {
    const job = await getJob(jobId);
    onUpdate(job);
    if (job.status === "done" || job.status === "error") return job;
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
}

export function UploadDropzone() {
  const { loadTender } = useRequirements();
  const [stage, setStage] = useState<UploadStage>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // #2: on a live extraction, flow straight into the matrix after a brief reveal,
  // so upload resolves into the worklist rather than dead-ending on a button.
  useEffect(() => {
    if (stage !== "done" || !isApiEnabled()) return;
    const timer = window.setTimeout(() => router.push("/review"), 1800);
    return () => window.clearTimeout(timer);
  }, [stage, router]);

  function stageFiles(fileList: FileList | null, append = true) {
    if (stage === "extracting") return;
    const all = fileList ? Array.from(fileList) : [];
    if (all.length === 0) return;
    setErrorMessage(null);

    const unsupported = all.find((file) => !isAcceptedTenderFile(file));
    if (unsupported) {
      setFileName(unsupported.name);
      setErrorMessage("Use PDF, Word, Excel, CSV or ZIP tender-pack files.");
      setStage("error");
      return;
    }

    const oversized = all.find((f) =>
      f.size > (isZipPack(f) ? MAX_ZIP_BYTES : MAX_DOCUMENT_BYTES)
    );
    if (oversized) {
      setFileName(oversized.name);
      setErrorMessage(
        isZipPack(oversized)
          ? `${oversized.name} is over 200MB. ZIP tender packs must be under 200MB.`
          : `${oversized.name} is over 50MB. Each document must be under 50MB.`
      );
      setStage("error");
      return;
    }

    setStagedFiles((current) => {
      const merged = append ? [...current, ...all] : all;
      return Array.from(
        new Map(merged.map((file) => [fileKey(file), file])).values()
      );
    });
    setJob(null);
    setStage("idle");
  }

  async function startUpload() {
    if (stage === "extracting" || stagedFiles.length === 0) return;

    const all = stagedFiles;
    setFileName(packLabel(all));
    setStage("extracting");

    // No API configured → wireframe path (fake extraction, mock stays in place).
    if (!isApiEnabled()) {
      window.setTimeout(() => setStage("done"), 1800);
      return;
    }

    // Live path: upload the pack → background job → poll for live progress → load.
    try {
      const { jobId, tenderId } = await uploadTender(all, all[0].name);
      const finalJob = await pollJob(jobId, setJob);
      if (finalJob.status === "error") {
        setErrorMessage(finalJob.detail || "We could not process this tender pack.");
        setStage("error");
        return;
      }
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
    stageFiles(event.dataTransfer.files);
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
    setStagedFiles([]);
    setErrorMessage(null);
    setJob(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeStagedFile(key: string) {
    setStagedFiles((current) => {
      const next = current.filter((file) => fileKey(file) !== key);
      return next;
    });
  }

  if (stage === "done") {
    const found = job?.requirementCount;
    const dealBreakers = job?.dealBreakerCount;
    return (
      <div className="w-full max-w-xl">
        <h2 className="text-base font-semibold text-ink">
          {isApiEnabled() ? "Requirements extracted" : "Sample matrix ready"}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {!isApiEnabled() ? (
            <>
              We did not parse{" "}
              <span className="font-medium text-ink">{fileName}</span> because no
              live API is configured on this deployment.
            </>
          ) : found != null ? (
            <>
              Found <span className="font-medium text-ink">{found}</span>{" "}
              requirement{found === 1 ? "" : "s"}{" "}
              {stagedFiles.length > 1 || isZipPack(stagedFiles[0])
                ? "across"
                : "from"}{" "}
              <span className="font-medium text-ink">
                {packDoneLabel(stagedFiles)}
              </span>
              {dealBreakers != null && dealBreakers > 0 ? (
                <>
                  {", "}
                  <span className="font-medium text-signal-oxblood">
                    {dealBreakers}
                  </span>{" "}
                  flagged as deal-breaker{dealBreakers === 1 ? "" : "s"}
                </>
              ) : null}
              .
            </>
          ) : (
            <>
              Built the compliance matrix from{" "}
              <span className="font-medium text-ink">{fileName}</span>.
            </>
          )}
        </p>
        {isApiEnabled() && (
          <p className="mt-1 font-mono text-xs text-ink-muted">
            Opening your compliance matrix…
          </p>
        )}
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
    // Live: the staged "watch it read your tender" view, driven by the polled job.
    if (isApiEnabled()) {
      return (
        <ProcessingView
          job={job}
          fileName={fileName}
          fileCount={stagedFiles.length}
          isArchive={isZipPack(stagedFiles[0])}
        />
      );
    }
    // Mock: a brief sample-open moment (no live extraction to show).
    return (
      <div className="flex w-full max-w-xl items-center gap-3">
        <span
          className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-[3px] border-hairline border-t-forest"
          aria-hidden
        />
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">
            Opening the sample matrix…
          </h2>
          <p
            className="truncate text-sm text-ink-muted"
            title={fileName ?? undefined}
          >
            {fileName}
          </p>
        </div>
      </div>
    );
  }

  const stagedCount = stagedFiles.length;

  return (
    // Centred intake: one prominent slot as the single focal action, grounded on
    // the blank register it files into.
    <div className="w-full text-center">
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
        className={`surface-grain group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-14 shadow-[var(--depth-sheet)] transition-colors ${
          isDragging
            ? "border-forest bg-forest/5"
            : "border-hairline bg-paper-raised hover:border-forest hover:bg-paper"
        }`}
      >
        {/* A document being filed, not a generic upload arrow: a sheet with a
            folded corner and ruled lines, echoing the register below. */}
        <span
          className={`inline-flex h-20 w-20 items-center justify-center rounded-full bg-paper-recessed shadow-[var(--depth-pressed)] transition-colors ${
            isDragging ? "text-forest" : "text-ink-muted group-hover:text-forest"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-9 w-9"
            aria-hidden
          >
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M8.5 13h7" />
            <path d="M8.5 16.5h4.5" />
          </svg>
        </span>

        <p className="mt-6 font-serif text-2xl font-semibold leading-tight text-ink">
          {isDragging
            ? "Let go to file it"
            : stagedCount > 0
              ? "Add more tender documents"
              : "Drop your tender pack"}
        </p>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
          PDF · Word · Excel · CSV · ZIP
        </p>
      </div>

      {stagedCount > 0 && (
        <div className="mx-auto mt-5 max-w-2xl rounded-md border border-hairline bg-paper-raised text-left shadow-[var(--depth-row)]">
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                Tender pack staged
              </p>
              <p className="mt-0.5 text-sm text-ink-muted">
                {stagedCount} document{stagedCount === 1 ? "" : "s"} ready to read
              </p>
            </div>
            <button
              type="button"
              onClick={startUpload}
              className="shrink-0 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
            >
              Read tender pack
            </button>
          </div>
          <ul className="divide-y divide-hairline">
            {stagedFiles.map((file) => {
              const key = fileKey(file);
              return (
                <li key={key} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="rounded-[3px] border border-hairline bg-paper-recessed px-1.5 py-1 font-mono text-[10px] font-medium leading-none text-ink shadow-[var(--depth-pressed)]">
                    {uploadKindShortLabel(file)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink" title={file.name}>
                    {file.name}
                  </span>
                  <span className="font-mono text-xs text-ink-muted">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStagedFile(key)}
                    className="rounded px-1.5 py-0.5 font-mono text-xs text-ink-muted transition-colors hover:bg-paper-recessed hover:text-ink"
                    aria-label={`Remove ${file.name}`}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={handleBrowseClick}
              className="font-mono text-xs text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:text-forest-hover"
            >
              Add more
            </button>
            <button
              type="button"
              onClick={reset}
              className="font-mono text-xs text-ink-muted transition-colors hover:text-ink"
            >
              Clear pack
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.xlsx,.csv,.zip,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/zip,application/x-zip-compressed"
        multiple
        className="hidden"
        onChange={(event) => {
          stageFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
