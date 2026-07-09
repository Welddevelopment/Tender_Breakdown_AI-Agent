"use client";

import Link from "next/link";

// The two landing-page calls to action (landing-page-brief §3, §14). The primary
// is one forest "Book a demo" button on light sections, inverting to a cream
// button on the dark bands so it always carries the most contrast in its
// viewport. Two dark tones exist because two dark grounds do: "dark" for the
// product's near-black ink (DemoView's closing band) and "pine" for the
// landing page's forest bands, which differ only in the focus ring offset
// matching the ground behind it. The secondary is a quiet "See it run" link
// into the guided demo at /demo. Each fires one analytics event; nothing
// else is instrumented.
//
// The destination is a scheduling link. Default is Joel's live Cal.com booking
// page so the deployed CTA works out of the box; NEXT_PUBLIC_BOOKING_URL still
// overrides it without a code change (brief §16.1) if we move scheduler.
const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://cal.com/joel-jeon-o29lfr/bidframe";

type Tone = "light" | "dark" | "pine";

function track(event: string, props?: Record<string, string>): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  w.dataLayer?.push({ event, ...props });
}

export function BookDemoButton({
  location,
  variant = "button",
  tone = "light",
  size = "md",
  className = "",
}: {
  location: string;
  variant?: "button" | "link";
  tone?: Tone;
  size?: "md" | "lg";
  className?: string;
}) {
  const sizeCls =
    size === "lg"
      ? "gap-2 px-5 py-3 text-sm sm:gap-2.5 sm:px-7 sm:py-3.5 sm:text-base"
      : "gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm";
  if (variant === "link") {
    // The pine link's ring offset matches pine-deep because the link form of
    // this CTA lives in the footer, which stands on the deeper ground; the
    // button form keeps the plain pine offset for the closing band.
    const linkTones: Record<Tone, string> = {
      dark: "text-paper/80 hover:text-paper focus-visible:ring-paper focus-visible:ring-offset-ink",
      pine: "text-paper/80 hover:text-paper focus-visible:ring-paper focus-visible:ring-offset-pine-deep",
      light:
        "text-ink-muted hover:text-forest focus-visible:ring-forest focus-visible:ring-offset-paper",
    };
    const linkTone = linkTones[tone];
    return (
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("demo_cta_click", { location })}
        className={`link-draw rounded-sm text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${linkTone} ${className}`}
      >
        Book a demo
      </a>
    );
  }

  const btnTones: Record<Tone, string> = {
    dark: "bg-paper text-ink hover:bg-paper-raised focus-visible:ring-paper focus-visible:ring-offset-ink",
    pine: "bg-paper text-ink hover:bg-paper-raised focus-visible:ring-paper focus-visible:ring-offset-pine",
    light:
      "bg-forest text-paper hover:bg-forest-hover focus-visible:ring-forest focus-visible:ring-offset-paper",
  };
  const btnTone = btnTones[tone];

  return (
    <a
      href={BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("demo_cta_click", { location })}
      className={`cta-shine group relative inline-flex items-center overflow-hidden rounded-md font-semibold shadow-[var(--depth-control)] transition-[transform,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:shadow-[0_11px_24px_-9px_rgba(33,29,23,0.42),0_3px_9px_-4px_rgba(33,29,23,0.26),0_0_24px_-6px_rgba(44,86,64,0.5)] active:translate-y-px active:rotate-[-0.75deg] active:scale-[0.985] active:shadow-[var(--depth-pressed)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${sizeCls} ${btnTone} ${className}`}
    >
      Book a demo
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
        className="transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-1.5 group-active:translate-x-0.5"
      >
        <path
          d="M2.5 7h9M8 3.5 11.5 7 8 10.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

export function SeeItRunLink({
  tone = "light",
  size = "md",
  className = "",
}: {
  tone?: Tone;
  size?: "md" | "lg";
  className?: string;
}) {
  const tones: Record<Tone, string> = {
    dark: "text-paper/60 hover:text-paper/90 focus-visible:ring-paper focus-visible:ring-offset-ink",
    pine: "text-paper/60 hover:text-paper/90 focus-visible:ring-paper focus-visible:ring-offset-pine",
    light:
      "text-ink-muted hover:text-forest focus-visible:ring-forest focus-visible:ring-offset-paper",
  };
  const t = tones[tone];
  return (
    <Link
      href="/demo"
      onClick={() => track("see_it_run_click")}
      className={`link-draw group inline-flex items-center gap-1 rounded-sm ${size === "lg" ? "text-sm" : "text-xs"} transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${t} ${className}`}
    >
      See it run
      <svg
        width="11"
        height="11"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
        className="transition-transform group-hover:translate-x-0.5"
      >
        <path
          d="M2.5 7h9M8 3.5 11.5 7 8 10.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
