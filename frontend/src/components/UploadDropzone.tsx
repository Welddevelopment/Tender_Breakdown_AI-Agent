"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  getJob,
  isApiEnabled,
  uploadTender,
  type JobStatus,
} from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";
import { loadDemoTender } from "@/data/demo-tender";
import type { Tender } from "@/types/requirement";
import {
  sourceDocumentKindFromFilename,
  sourceKindShortLabel,
} from "@/lib/source-doc";
import { ProcessingView } from "./ProcessingView";
import { RegisterPreview } from "./RegisterPreview";

type UploadStage = "idle" | "extracting" | "done" | "error";

// Why an upload failed, carried as a discriminant instead of sniffed back out
// of the message string (the old substring test keyed on "pdf"/"file" and broke
// the moment a .docx was rejected). The first three kinds are client-side
// rejections and never reach the full error screen — they surface inline on the
// offending file's own row while the rest of the pack stays staged — so the
// error state only ever wears "server" or "unknown".
type UploadErrorKind = "type" | "size" | "zip-size" | "server" | "unknown";
type RejectionKind = Extract<UploadErrorKind, "type" | "size" | "zip-size">;

interface StagedRejection {
  key: string;
  name: string;
  kind: RejectionKind;
}

const ERROR_HEADINGS: Record<UploadErrorKind, string> = {
  type: "We cannot read that file format yet.",
  size: "That document is too large.",
  "zip-size": "That ZIP pack is too large.",
  server: "We couldn't process this tender pack.",
  unknown: "Couldn't complete the upload.",
};

const REJECTION_NOTES: Record<RejectionKind, string> = {
  type: "Not a format we can read — use PDF, Word, Excel, CSV or ZIP",
  size: "Over the 50MB per-document limit",
  "zip-size": "Over the 200MB limit for ZIP tender packs",
};

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

// Why this file couldn't join the pack, or null if it can.
function rejectionKindFor(file: File): RejectionKind | null {
  if (!isAcceptedTenderFile(file)) return "type";
  if (file.size > (isZipPack(file) ? MAX_ZIP_BYTES : MAX_DOCUMENT_BYTES)) {
    return isZipPack(file) ? "zip-size" : "size";
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)}MB`;
}

function uploadKindShortLabel(file: File): string {
  if (isZipPack(file)) return "ZIP";
  return sourceKindShortLabel(sourceDocumentKindFromFilename(file.name));
}

// A chip label for a rejected file: its raw extension, since a file we can't
// read has no source-document kind to map to.
function rejectedChipLabel(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1) : "";
  return ext ? ext.slice(0, 4).toUpperCase() : "FILE";
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

// The demo build's extraction, replayed rather than skipped. With no API
// configured the PDF-in → requirements-out beat still has to play on stage, so
// this scripts the JobStatus frames the live pipeline would emit — pages read,
// sections split, the counts climbing to the sample tender's real totals, the
// deal-breakers landing late — and feeds them to the very same ProcessingView
// the live path uses. Hand-timed like a cue sheet, ~8 seconds end to end.
// Clause references in the messages are real ones from the sample tender —
// the same Bradwell seed the matrix opens on, so the numbers the replay lands
// on are exactly the numbers the judge then sees in the register. The tender
// arrives as an argument (lazy-loaded at replay start) so the prebake JSON
// stays out of the upload route's bundle (frontend-jawad.md A2).
function mockReplayFrames(demoTender: Tender): { at: number; job: JobStatus }[] {
  const seed = demoTender.requirements;
  const total = seed.length;
  const gatingTotal = seed.filter((r) => r.is_gating).length;
  const pages = Math.max(...seed.map((r) => r.source_page), 1);
  const sections = 12;
  const clauseA = seed.find((r) => r.is_gating) ?? seed[0];
  const clauseB = seed[Math.floor(seed.length / 2)] ?? clauseA;
  const req = (share: number) => Math.round(total * share);
  const cues: [number, Partial<JobStatus>][] = [
    [0, { stage: "reading", progress: 0.04, message: "Opening the tender…" }],
    [700, { progress: 0.1, pageCount: pages, message: `Reading ${pages} pages…` }],
    [1450, { stage: "chunking", progress: 0.18, sectionCount: sections, message: `Splitting into ${sections} sections…` }],
    [2150, { stage: "extract", progress: 0.28, chunkDone: 2, chunkTotal: sections, requirementCount: req(0.15), message: `Reading ${clauseA.source_clause} on page ${clauseA.source_page}…` }],
    [2850, { progress: 0.4, chunkDone: 4, requirementCount: req(0.3), message: "Extracting mandatory requirements…" }],
    [3550, { progress: 0.52, chunkDone: 7, requirementCount: req(0.55), message: `Reading ${clauseB.source_clause} on page ${clauseB.source_page}…` }],
    [4250, { progress: 0.64, chunkDone: 10, requirementCount: req(0.75), message: "Extracting service-level requirements…" }],
    [4950, { progress: 0.74, chunkDone: sections, requirementCount: req(0.9), message: "Last section read…" }],
    [5650, { stage: "reconcile", progress: 0.82, requirementCount: total, message: "Merging duplicates across sections…" }],
    [6350, { stage: "graph", progress: 0.89, dealBreakerCount: 1, message: "Flagging deal-breakers…" }],
    [6950, { progress: 0.93, dealBreakerCount: gatingTotal, message: "Mapping award criteria…" }],
    [7550, { stage: "autofill", progress: 0.97, message: "Drafting first answers from your evidence…" }],
    [8250, { status: "done", stage: "done", progress: 1, message: "Compliance matrix ready." }],
  ];
  // Later frames inherit everything earlier ones established (the page count,
  // the climbing requirement total), exactly as the live job status would.
  let acc: JobStatus = { status: "processing", stage: "reading", progress: 0 };
  return cues.map(([at, patch]) => {
    acc = { ...acc, ...patch };
    return { at, job: acc };
  });
}

export function UploadDropzone({
  onResolve,
}: {
  // The in-place resolve (layout.md §9): the parent workspace swaps itself for
  // the mounted matrix, no page swap. When absent (an unexpected standalone
  // mount) the component falls back to plain navigation.
  onResolve?: () => void;
} = {}) {
  const { loadTender } = useRequirements();
  const [stage, setStage] = useState<UploadStage>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [rejections, setRejections] = useState<StagedRejection[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<UploadErrorKind | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const mockTimersRef = useRef<number[]>([]);

  function clearMockTimers() {
    for (const id of mockTimersRef.current) window.clearTimeout(id);
    mockTimersRef.current = [];
  }

  // The scripted replay must not keep firing into an unmounted component.
  useEffect(() => clearMockTimers, []);

  // #2: on a live extraction, flow straight into the matrix, so upload resolves
  // into the worklist rather than dead-ending on a button. The delay is the
  // choreography's, not a spinner's: long enough for the filed card to settle
  // and the register's last rows to ink, then the in-place resolve takes over.
  // The demo replay deliberately holds instead — the presenter opens the matrix
  // when the room is ready for it.
  useEffect(() => {
    if (stage !== "done" || !isApiEnabled()) return;
    const timer = window.setTimeout(() => {
      if (onResolve) onResolve();
      else router.push("/review");
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [stage, router, onResolve]);

  function stageFiles(fileList: FileList | null, append = true) {
    if (stage === "extracting") return;
    const all = fileList ? Array.from(fileList) : [];
    if (all.length === 0) return;

    // Partition rather than veto: one bad file must not nuke the whole staged
    // pack. Valid documents join the pack; rejects get their own row with the
    // reason, and the presenter carries on.
    const accepted: File[] = [];
    const rejected: StagedRejection[] = [];
    for (const file of all) {
      const kind = rejectionKindFor(file);
      if (kind) {
        rejected.push({ key: fileKey(file), name: file.name, kind });
      } else {
        accepted.push(file);
      }
    }

    setStagedFiles((current) => {
      const merged = append ? [...current, ...accepted] : accepted;
      return Array.from(
        new Map(merged.map((file) => [fileKey(file), file])).values()
      );
    });
    setRejections((current) => {
      const merged = [...current, ...rejected];
      return Array.from(new Map(merged.map((r) => [r.key, r])).values());
    });
    setErrorMessage(null);
    setErrorKind(null);
    setJob(null);
    setStage("idle");
  }

  async function startUpload() {
    if (stage === "extracting" || stagedFiles.length === 0) return;

    const all = stagedFiles;
    setFileName(packLabel(all));
    setJob(null);
    setStage("extracting");

    // No API configured → the scripted replay drives the same ProcessingView,
    // ending on the sample tender's real counts. The demo tender lazy-loads
    // here (a same-origin chunk, milliseconds) so it never rides the bundle.
    if (!isApiEnabled()) {
      clearMockTimers();
      const demoTender = await loadDemoTender();
      for (const { at, job: frame } of mockReplayFrames(demoTender)) {
        mockTimersRef.current.push(
          window.setTimeout(() => {
            setJob(frame);
            if (frame.status === "done") setStage("done");
          }, at)
        );
      }
      return;
    }

    // Live path: upload the pack → background job → poll for live progress → load.
    try {
      const { jobId, tenderId } = await uploadTender(all, all[0].name);
      const finalJob = await pollJob(jobId, setJob);
      if (finalJob.status === "error") {
        setErrorMessage(finalJob.detail || "We could not process this tender pack.");
        setErrorKind("server");
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
      setErrorKind(error instanceof ApiError ? "server" : "unknown");
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
    clearMockTimers();
    setStage("idle");
    setFileName(null);
    setStagedFiles([]);
    setRejections([]);
    setErrorMessage(null);
    setErrorKind(null);
    setJob(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeStagedFile(key: string) {
    setStagedFiles((current) => current.filter((file) => fileKey(file) !== key));
  }

  function removeRejection(key: string) {
    setRejections((current) => current.filter((r) => r.key !== key));
  }

  if (stage === "done") {
    // The mock replay's final frame always carries the sample counts (the last
    // cue sets requirementCount and dealBreakerCount), so both paths read
    // their totals straight off the job.
    const found = job?.requirementCount;
    const dealBreakers = job?.dealBreakerCount;
    // The filed card sits on the forest arrival ground: the record formed
    // inside the guidance layer (the two-layer handoff, design-language). On
    // the demo path there is no auto-resolve — the presenter opens the matrix
    // deliberately, on the forest button, when the room is ready for it.
    return (
      <div className="arrival-ground mx-auto w-full max-w-2xl rounded-2xl px-5 py-8 sm:px-8">
        <div className="surface-grain mx-auto w-full max-w-xl rounded-2xl border border-hairline bg-paper-raised p-6 shadow-[var(--depth-sheet)]">
        <h2 className="text-base font-semibold text-ink">
          {isApiEnabled() ? "Requirements extracted" : "Sample compliance matrix ready"}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {!isApiEnabled() ? (
            <>
              <span className="font-medium text-ink">{found}</span> requirement
              {found === 1 ? "" : "s"} filed into the matrix
              {dealBreakers != null && dealBreakers > 0 ? (
                <>
                  {", "}
                  <span className="font-medium text-signal-oxblood">
                    {dealBreakers}
                  </span>{" "}
                  flagged as deal-breaker{dealBreakers === 1 ? "" : "s"}
                </>
              ) : null}
              . Ready to review.
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
        <div className="mt-5 flex items-center gap-4">
          {onResolve ? (
            <button
              type="button"
              onClick={onResolve}
              className="inline-flex items-center rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper shadow-[var(--depth-control)] transition-colors hover:bg-forest-hover"
            >
              {isApiEnabled() ? "Open the matrix" : "Open the sample matrix"}
            </button>
          ) : (
            <Link
              href="/review"
              className="inline-flex items-center rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper shadow-[var(--depth-control)] transition-colors hover:bg-forest-hover"
            >
              {isApiEnabled() ? "View extracted requirements" : "View sample matrix"}
            </Link>
          )}
          <button
            type="button"
            onClick={reset}
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Upload another
          </button>
        </div>
        </div>
      </div>
    );
  }

  if (stage === "error") {
    // Only server/network failures land here now; a bad file never leaves the
    // staged list. Same raised-paper idiom as the dropzone, so failure still
    // looks like part of the same stationery.
    return (
      <div className="surface-grain mx-auto w-full max-w-xl rounded-2xl border border-hairline bg-paper-raised p-6 shadow-[var(--depth-sheet)]">
        <h2 className="text-base font-semibold text-ink">
          {ERROR_HEADINGS[errorKind ?? "unknown"]}
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
    // Both paths run the same staged "watch it read your tender" view — live
    // driven by the polled job, mock by the scripted replay — with the idle
    // screen's blank register held underneath, inking itself in as the
    // requirement count climbs: the empty form becoming the filled matrix.
    // The whole moment stands on the forest arrival ground (a canopy shadow on
    // moss): the guidance layer holds the paper record while it forms.
    return (
      <div className="arrival-ground w-full rounded-2xl px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-xl">
          <ProcessingView
            job={job}
            fileName={fileName}
            fileCount={stagedFiles.length}
            isArchive={isZipPack(stagedFiles[0])}
          />
        </div>
        <div className="mx-auto mt-8 max-w-md">
          <RegisterPreview filled={job?.requirementCount ?? 0} />
        </div>
      </div>
    );
  }

  const stagedCount = stagedFiles.length;

  return (
    // Centred intake: one prominent slot as the single focal action, grounded on
    // the blank register it files into. The hero-enter stagger (shared, unscoped
    // in globals.css, motion-safe) settles glyph → headline → register once on
    // load, so the page arrives like a form being laid on the desk.
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
          className={`hero-enter inline-flex h-20 w-20 items-center justify-center rounded-full bg-paper-recessed shadow-[var(--depth-pressed)] transition-colors ${
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

        <p className="hero-enter-2 mt-6 font-serif text-2xl font-semibold leading-tight text-ink">
          {isDragging
            ? "Let go to file it"
            : stagedCount > 0
              ? "Add more tender documents"
              : "Drop your tender pack"}
        </p>
        <p className="hero-enter-2 mt-2 max-w-[52ch] text-sm leading-relaxed text-ink-muted">
          One document or the whole tender pack. We read them into a compliance
          matrix and flag the deal-breakers.
        </p>
        <p className="hero-enter-2 mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
          PDF · Word · Excel · CSV · ZIP
        </p>
      </div>

      {(stagedCount > 0 || rejections.length > 0) && (
        <div className="mx-auto mt-5 max-w-2xl rounded-md border border-hairline bg-paper-raised text-left shadow-[var(--depth-row)]">
          {stagedCount > 0 && (
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
                className="shrink-0 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper shadow-[var(--depth-control)] transition-colors hover:bg-forest-hover"
              >
                Read tender pack
              </button>
            </div>
          )}
          <ul className="divide-y divide-hairline">
            {stagedFiles.map((file) => {
              const key = fileKey(file);
              return (
                <li key={key} className="flex items-center gap-3 px-4 py-2.5">
                  {/* Accent = traceable to source: these chips name the source
                      documents everything downstream will cite. */}
                  <span className="rounded-[3px] border border-accent/30 bg-accent-soft px-1.5 py-1 font-mono text-[10px] font-medium leading-none text-accent shadow-[var(--depth-pressed)]">
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
            {/* Files that couldn't join the pack keep their row — set aside with
                a reason in the margin, not thrown out with the whole pack. */}
            {rejections.map((rejection) => (
              <li key={rejection.key} className="flex items-start gap-3 px-4 py-2.5">
                <span className="rounded-[3px] border border-signal-oxblood-frame/40 bg-paper-recessed px-1.5 py-1 font-mono text-[10px] font-medium leading-none text-signal-oxblood shadow-[var(--depth-pressed)]">
                  {rejectedChipLabel(rejection.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-muted" title={rejection.name}>
                    {rejection.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-signal-oxblood">
                    {REJECTION_NOTES[rejection.kind]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRejection(rejection.key)}
                  className="rounded px-1.5 py-0.5 font-mono text-xs text-ink-muted transition-colors hover:bg-paper-recessed hover:text-ink"
                  aria-label={`Dismiss ${rejection.name}`}
                >
                  ×
                </button>
              </li>
            ))}
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
