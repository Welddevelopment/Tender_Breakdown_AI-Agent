"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTenders, isApiEnabled, type TenderSummary } from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";

// #29: the app-level tenders list. Every tender uploaded to the live backend, so a
// bid writer can reopen one where they left off instead of re-uploading. Live-only
// (the mock/demo has no stored tenders); it degrades to an honest note.
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
      <p className="max-w-[60ch] text-sm text-ink-muted">
        Your uploaded tenders appear here once Bidframe is connected to the live
        reader. In this preview there is nothing stored, so head to the worked
        example instead.
      </p>
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
    return <p className="text-sm text-ink-muted">Loading your tenders&hellip;</p>;
  }
  if (tenders.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No tenders yet. Upload one to get started.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {tenders.map((t) => (
        <li key={t.tenderId} className="border-t border-hairline first:border-t-0">
          <button
            type="button"
            onClick={() => open(t.tenderId)}
            disabled={opening !== null}
            className="flex w-full items-center justify-between gap-4 rounded-md px-2 py-4 text-left transition-colors hover:bg-paper-raised disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="min-w-0">
              <span className="block truncate font-serif text-base font-medium text-ink">
                {t.title}
              </span>
              <span className="font-mono text-xs text-ink-muted">
                {t.requirementCount} requirement{t.requirementCount === 1 ? "" : "s"}
                {" · "}
                {t.tenderId}
              </span>
            </span>
            <span className="shrink-0 font-mono text-xs text-forest">
              {opening === t.tenderId ? "Opening…" : "Open →"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
