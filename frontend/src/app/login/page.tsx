"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError, isApiEnabled, isGoogleSignInEnabled } from "@/lib/api";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SiteHeader } from "@/components/SiteHeader";

// The sign-in page. Bidframe is invite-only, so there is no registration here — an
// account is created for a customer by an admin. On success we return the person to
// wherever they were headed (the ?next path the gate remembered), else the app home.

function nextTarget(): string {
  if (typeof window === "undefined") return "/upload";
  const next = new URLSearchParams(window.location.search).get("next");
  // Only ever follow an internal path — never an absolute or protocol-relative URL.
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/upload";
}

export default function LoginPage() {
  const { status, signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const showGoogle = isGoogleSignInEnabled();

  // Already signed in (or just signed in) → leave the login page for the app.
  useEffect(() => {
    if (status === "authed") router.replace(nextTarget());
  }, [status, router]);

  const onGoogleCredential = useCallback(
    async (idToken: string) => {
      setError(null);
      setSubmitting(true);
      try {
        await signInWithGoogle(idToken);
        router.replace(nextTarget());
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Google sign-in failed. Please try again."
        );
        setSubmitting(false);
      }
    },
    [signInWithGoogle, router]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isApiEnabled()) {
      setError("Sign-in is not available in this preview build.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace(nextTarget());
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't reach the server. Check your connection and try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper paper-grid">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Account
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-ink">
            Sign in
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Bidframe is available to invited accounts. Enter the details we set up
            for you.
          </p>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-hairline bg-paper-raised px-3 py-2.5 text-sm text-ink shadow-[var(--depth-control)] outline-none transition-colors focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-forest/40"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                Password
              </span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md border border-hairline bg-paper-raised px-3 py-2.5 text-sm text-ink shadow-[var(--depth-control)] outline-none transition-colors focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-forest/40"
              />
            </label>

            {error && (
              <p
                role="alert"
                className="border-l-2 border-signal-oxblood-frame pl-3 text-sm leading-snug text-ink"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 inline-flex items-center justify-center rounded-md bg-forest px-5 py-2.5 text-sm font-semibold text-paper shadow-[var(--depth-control)] transition-[transform,background-color] hover:bg-forest-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {showGoogle && (
            <div className="mt-6">
              <div className="flex items-center gap-3" aria-hidden>
                <span className="h-px flex-1 bg-hairline" />
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                  or
                </span>
                <span className="h-px flex-1 bg-hairline" />
              </div>
              <div className="mt-6">
                <GoogleSignInButton
                  onCredential={onGoogleCredential}
                  onError={setError}
                />
              </div>
            </div>
          )}

          <p className="mt-8 text-xs leading-relaxed text-ink-muted">
            No account yet?{" "}
            <a
              href="https://cal.com/joel-jeon-o29lfr/bidframe"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-hairline decoration-1 underline-offset-4 transition-colors hover:text-ink"
            >
              Book a demo
            </a>{" "}
            and we&rsquo;ll set you up.
          </p>
        </div>
      </main>
    </div>
  );
}
