import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

// The post-booking landing (design uplift, change C). Cal.com redirects here on a
// successful booking (its "Redirect on booking" / successRedirectUrl, set to
// <site>/thank-you). It closes the funnel that used to strand the visitor on
// Cal.com: the same Civic Record shell as the landing, one reassuring line, and
// two ways forward — a worked example while they wait, or back to Bidframe. It
// reads no query params, so Cal.com's appended booking params are ignored
// gracefully, and it is valid as a directly-visited URL.
export const metadata: Metadata = {
  title: "You're booked — Bidframe",
  description:
    "Your Bidframe demo is booked. While you wait, see a worked example of Bidframe reading a real public-sector tender.",
};

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-paper paper-grid">
      <SiteHeader />

      <main className="mx-auto flex max-w-[1160px] flex-col items-center px-6 py-20 text-center sm:py-28">
        <p className="hero-enter font-mono text-xs font-medium uppercase tracking-wide text-ink-muted">
          Demo booked
        </p>
        <h1 className="hero-enter-2 mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          You&rsquo;re booked
        </h1>
        <p className="hero-enter-2 mt-4 max-w-[52ch] text-lg leading-relaxed text-ink-muted">
          Thanks. You&rsquo;ll get a calendar invite by email with the joining
          link. Bring one tender you have already bid and we&rsquo;ll read it
          live.
        </p>
        <div className="hero-enter-3 mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
          <Link
            href="/demo"
            className="rounded-sm text-base text-forest underline decoration-forest/30 decoration-1 underline-offset-4 transition-colors hover:text-forest-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            See it run while you wait
          </Link>
          <Link
            href="/"
            className="rounded-sm text-base text-ink-muted underline decoration-hairline decoration-1 underline-offset-4 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Back to Bidframe
          </Link>
        </div>
      </main>
    </div>
  );
}
