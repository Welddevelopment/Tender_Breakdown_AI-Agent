"use client";

import { useEffect } from "react";
import Link from "next/link";

// Route-level error boundary (Next App Router). Catches a render error in any app
// screen so one broken component never white-screens the whole demo. The
// RequirementsProvider lives in the root layout, above this boundary, so the
// in-memory review survives a reset.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1160px] flex-col items-start justify-center px-6">
      <p className="font-mono text-xs font-medium uppercase tracking-wide text-signal-oxblood">
        Something went wrong
      </p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">
        This screen hit an error.
      </h1>
      <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-muted">
        Try again, or go back to the start. Your review so far is kept.
      </p>
      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm text-ink-muted transition-colors hover:text-ink"
        >
          Back to start
        </Link>
      </div>
    </div>
  );
}
