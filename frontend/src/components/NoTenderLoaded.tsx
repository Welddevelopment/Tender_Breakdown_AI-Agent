"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getTenders, isApiEnabled, type TenderSummary } from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";

// The live-product empty state: shown on the review / answers / graph surfaces
// when no tender has been loaded yet, in place of the sample data. It now gives
// both recovery paths: pick an existing tender or upload a new tender pack. The
// mock demo build (no API) never renders this.
export function NoTenderLoaded({
  heading = "Nothing to review yet",
  body = "Pick a tender from the library or upload a tender pack to continue.",
}: {
  heading?: string;
  body?: string;
}) {
  const { loadTender } = useRequirements();
  const router = useRouter();
  const pathname = usePathname();
  const [recent, setRecent] = useState<TenderSummary[] | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiEnabled()) return;
    let cancelled = false;
    getTenders()
      .then((rows) => {
        if (!cancelled) setRecent(rows.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setRecent([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function openTender(id: string) {
    setOpening(id);
    try {
      await loadTender(id);
      router.push(pathname);
    } catch {
      setOpening(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-20 text-center">
      <h2 className="font-serif text-2xl font-semibold text-ink">{heading}</h2>
      <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-ink-muted">
        {body}
      </p>

      {recent && recent.length > 0 && (
        <div className="mt-6 w-full rounded-lg border border-hairline bg-paper-raised p-3 text-left shadow-[var(--depth-row)]">
          <p className="px-1 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            Recent tenders
          </p>
          <ul className="mt-2 divide-y divide-hairline">
            {recent.map((tender) => (
              <li key={tender.tenderId}>
                <button
                  type="button"
                  onClick={() => openTender(tender.tenderId)}
                  disabled={opening !== null}
                  className="flex w-full items-center justify-between gap-3 rounded px-1 py-2 text-left transition-colors hover:bg-paper-recessed disabled:cursor-wait disabled:opacity-70"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">
                      {tender.title}
                    </span>
                    <span className="font-mono text-[11px] text-ink-muted">
                      {tender.requirementCount} requirement
                      {tender.requirementCount === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-forest">
                    {opening === tender.tenderId ? "Opening..." : "Open"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/upload#your-tenders"
          className="inline-flex items-center rounded-md bg-forest px-5 py-2.5 text-sm font-semibold text-paper shadow-[var(--depth-control)] transition-colors hover:bg-forest-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          Pick a tender
        </Link>
        <Link
          href="/upload"
          className="inline-flex items-center rounded-md border border-hairline bg-paper-raised px-5 py-2.5 text-sm font-semibold text-ink shadow-[var(--depth-control)] transition-colors hover:border-forest hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          Upload a tender
        </Link>
      </div>
    </div>
  );
}
