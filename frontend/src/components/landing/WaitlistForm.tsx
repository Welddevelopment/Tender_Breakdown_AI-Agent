"use client";

import { useState } from "react";

// The waitlist capture (lower priority than Book a demo, per the build call): a
// single email field so interest has somewhere to land if outreach works. It is
// wired by configuration, not a code change: it POSTs to a no-code form endpoint
// (NEXT_PUBLIC_WAITLIST_ENDPOINT) when set, else opens a mailto to
// NEXT_PUBLIC_WAITLIST_EMAIL. TODO before outreach: set one of those env vars so
// the address is actually stored.

const ENDPOINT = process.env.NEXT_PUBLIC_WAITLIST_ENDPOINT;
const MAILTO = process.env.NEXT_PUBLIC_WAITLIST_EMAIL;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type State = "idle" | "loading" | "done";

function track(email: string): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  w.dataLayer?.push({ event: "waitlist_submit", email });
}

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError("That email does not look right. Try again.");
      return;
    }
    setError(null);
    setState("loading");
    track(email);
    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error("bad status");
      } else if (MAILTO) {
        const subject = encodeURIComponent("Bidframe waitlist");
        const body = encodeURIComponent(`Please add me to the waitlist: ${email}`);
        window.location.href = `mailto:${MAILTO}?subject=${subject}&body=${body}`;
      }
      setState("done");
    } catch {
      setState("idle");
      setError("Something went wrong. Try again, or book a demo instead.");
    }
  }

  if (state === "done") {
    return (
      <p className="mt-4 font-mono text-sm text-forest" role="status">
        You are on the list. We&rsquo;ll be in touch when a place opens.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4" noValidate>
      <div className="mx-auto flex max-w-[24rem] flex-col gap-2 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          Your email
        </label>
        <input
          id="waitlist-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="you@company.co.uk"
          aria-invalid={error !== null}
          className="h-10 flex-1 rounded-md border border-hairline bg-paper px-3 text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="h-10 shrink-0 rounded-md border border-ink/25 px-4 text-sm font-medium text-ink transition-colors hover:bg-paper-recessed focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised disabled:opacity-60"
        >
          {state === "loading" ? "Adding…" : "Join the waitlist"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-signal-oxblood" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
