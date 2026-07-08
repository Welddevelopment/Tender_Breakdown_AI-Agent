"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTenders, isApiEnabled, type TenderSummary } from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";

// #29: the app-level tenders list. Every tender uploaded to the live backend, so a
// bid writer can reopen one where they left off instead of re-uploading. Live-only
// (the mock/demo has no stored tenders); it degrades to labelled sample cards that
// point at the worked example. Rows are raised paper cards — depth means focus.
// The section header lives on the tender-library page, above this list.

// The uploaded-at timestamp, folded to a coarse relative phrase for the card's
// mono subline. Null when the ISO string doesn't parse — render nothing rather
// than "NaN days ago".
function relativeUploadedAt(iso: string): string | null {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 31) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

// Small inline spinner for the row being opened. currentColor so it inherits the
// forest of the "Open" affordance; still under prefers-reduced-motion.
function Spinner() {
  return (
    <svg
      className="h-3 w-3 motion-safe:animate-spin"
      viewBox="0 0 12 12"
      aria-hidden
    >
      <circle
        cx="6"
        cy="6"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M6 1a5 5 0 0 1 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// The faint trailing id chip: machine content, deliberately quiet next to the
// serif title, and dropped entirely on small widths where it earns nothing.
function IdChip({ id }: { id: string }) {
  return (
    <span className="hidden shrink-0 rounded border border-hairline px-1 py-px font-mono text-[10px] text-ink-muted/70 sm:inline-block">
      {id}
    </span>
  );
}

// The oxblood deal-breaker bead + count. Status colour on text and dot only —
// never a background — and quiet (absent) at zero, matching the ledger's rule
// that the alarm goes silent once nothing can disqualify the bid.
function DealBreakerBead({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-signal-oxblood">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal-oxblood" />
      {count} deal-breaker{count === 1 ? "" : "s"}
    </span>
  );
}

// One tender as a raised paper card. Only THIS card disables while it opens —
// clicking one tender must never read as the whole page freezing.
function TenderRow({
  tender: t,
  opening,
  onOpen,
}: {
  tender: TenderSummary;
  opening: boolean;
  onOpen: () => void;
}) {
  const uploaded = t.uploadedAt ? relativeUploadedAt(t.uploadedAt) : null;
  const showMeter = t.decidedCount !== undefined && t.requirementCount > 0;
  const pct = showMeter
    ? Math.min(100, Math.round(((t.decidedCount as number) / t.requirementCount) * 100))
    : 0;

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        disabled={opening}
        className="group flex w-full items-center justify-between gap-4 rounded-lg border border-hairline bg-paper-raised surface-grain px-4 py-4 text-left shadow-[var(--depth-row)] transition-shadow duration-150 hover:shadow-[var(--depth-sheet)] focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-wait"
      >
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-serif text-base font-medium text-ink">
              {t.title}
            </span>
            <IdChip id={t.tenderId} />
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-muted">
            <span>
              {t.requirementCount} requirement{t.requirementCount === 1 ? "" : "s"}
            </span>
            {t.dealBreakerCount !== undefined && (
              <DealBreakerBead count={t.dealBreakerCount} />
            )}
            {uploaded && <span>uploaded {uploaded}</span>}
          </span>
          {showMeter && (
            <span className="mt-2 block max-w-[16rem]">
              <span
                className="block h-1 w-full overflow-hidden rounded-full bg-hairline"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Requirements reviewed"
              >
                <span
                  className="block h-full rounded-full bg-forest"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="mt-1 block font-mono text-[10px] text-ink-muted">
                {t.decidedCount} of {t.requirementCount} reviewed
              </span>
            </span>
          )}
        </span>
        <span className="shrink-0 font-mono text-xs text-forest">
          {opening ? (
            <span className="inline-flex items-center gap-1.5">
              <Spinner />
              Opening…
            </span>
          ) : (
            <span className="inline-block transition-transform duration-150 motion-safe:group-hover:translate-x-0.5">
              Open →
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

// Illustrative card for the no-API preview build: same paper as the real rows,
// clearly stamped "Sample", and it walks through to the worked example so this
// section is never a bare paragraph in the demo.
function SampleCard({
  title,
  requirementCount,
  dealBreakerCount,
}: {
  title: string;
  requirementCount: number;
  dealBreakerCount: number;
}) {
  return (
    <li>
      <Link
        href="/pack"
        className="group flex w-full items-center justify-between gap-4 rounded-lg border border-hairline bg-paper-raised surface-grain px-4 py-4 shadow-[var(--depth-row)] transition-shadow duration-150 hover:shadow-[var(--depth-sheet)] focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-serif text-base font-medium text-ink">
              {title}
            </span>
            <span className="shrink-0 rounded border border-hairline px-1 py-px font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted/70">
              Sample
            </span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-muted">
            <span>
              {requirementCount} requirement{requirementCount === 1 ? "" : "s"}
            </span>
            <DealBreakerBead count={dealBreakerCount} />
          </span>
        </span>
        <span className="shrink-0 font-mono text-xs text-forest">
          <span className="inline-block transition-transform duration-150 motion-safe:group-hover:translate-x-0.5">
            Worked example →
          </span>
        </span>
      </Link>
    </li>
  );
}

export function TendersList() {
  const { loadTender } = useRequirements();
  const router = useRouter();
  const [tenders, setTenders] = useState<TenderSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiEnabled()) return; // mock is handled at render time
    let cancelled = false;
    getTenders()
      .then((t) => {
        if (!cancelled) setTenders(t);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function open(id: string) {
    setOpening(id);
    try {
      await loadTender(id);
      router.push("/review");
    } catch {
      setOpening(null);
      setError(true);
    }
  }

  if (!isApiEnabled()) {
    return (
      <div>
        <p className="max-w-[60ch] text-sm text-ink-muted">
          Your uploaded tenders appear here once Bidframe is connected to the live
          reader. In this preview there is nothing stored, so head to{" "}
          <Link
            href="/pack"
            className="font-medium text-forest underline underline-offset-2 transition-colors hover:text-forest-hover"
          >
            the worked example
          </Link>{" "}
          instead.
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          <SampleCard
            title="Mixed-pack worked example"
            requirementCount={138}
            dealBreakerCount={57}
          />
        </ul>
      </div>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-signal-oxblood">
        Couldn&rsquo;t load your tenders. Check the connection, then try again.
      </p>
    );
  }
  if (tenders === null) {
    // Skeleton cards at the real rows' size, so the register doesn't jump when
    // the summaries land. Pulse only when motion is welcome.
    return (
      <div>
        <p className="sr-only">Loading your tenders…</p>
        <ul aria-hidden className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="rounded-lg border border-hairline bg-paper-raised px-4 py-4 shadow-[var(--depth-row)]"
            >
              <div className="motion-safe:animate-pulse">
                <div className="h-4 w-2/5 rounded bg-paper-recessed" />
                <div className="mt-2.5 h-3 w-1/4 rounded bg-paper-recessed" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (tenders.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-hairline px-6 py-10 text-center">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          Nothing on file
        </p>
        <h3 className="mt-3 font-serif text-xl font-semibold text-ink">
          Your register is empty
        </h3>
        <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-ink-muted">
          Drop your first tender pack above to get started — it will be filed
          here, ready to reopen where you left off.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {tenders.map((t) => (
        <TenderRow
          key={t.tenderId}
          tender={t}
          opening={opening === t.tenderId}
          onOpen={() => open(t.tenderId)}
        />
      ))}
    </ul>
  );
}
