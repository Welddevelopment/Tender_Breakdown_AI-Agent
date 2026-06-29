"use client";

import Link from "next/link";

// The two landing-page calls to action (landing-page-brief §3, §14). The primary
// is one forest "Book a demo" button on light sections, inverting to a cream
// button on the dark ink bands so it always carries the most contrast in its
// viewport. The secondary is a quiet "See it run" link into the preloaded demo
// at /review. Each fires one analytics event; nothing else is instrumented.
//
// The destination is a scheduling link, set via NEXT_PUBLIC_BOOKING_URL so it
// can be swapped without a code change (brief §16.1). Until it is set, the
// button falls back to an on-page anchor.
const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL ?? "#book-a-demo";

type Tone = "light" | "dark";

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
      ? "gap-2.5 px-7 py-3.5 text-base"
      : "gap-2 px-5 py-2.5 text-sm";
  if (variant === "link") {
    const linkTone =
      tone === "dark"
        ? "text-paper/80 hover:text-paper focus-visible:ring-paper focus-visible:ring-offset-ink"
        : "text-ink-muted hover:text-forest focus-visible:ring-forest focus-visible:ring-offset-paper";
    return (
      <a
        href={BOOKING_URL}
        onClick={() => track("demo_cta_click", { location })}
        className={`rounded-sm text-sm underline decoration-hairline decoration-1 underline-offset-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${linkTone} ${className}`}
      >
        Book a demo
      </a>
    );
  }

  const btnTone =
    tone === "dark"
      ? "bg-paper text-ink hover:bg-paper-raised focus-visible:ring-paper focus-visible:ring-offset-ink"
      : "bg-forest text-paper hover:bg-forest-hover focus-visible:ring-forest focus-visible:ring-offset-paper";

  return (
    <a
      href={BOOKING_URL}
      onClick={() => track("demo_cta_click", { location })}
      className={`group inline-flex items-center rounded-md font-semibold shadow-[var(--depth-control)] transition-[transform,background-color] active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${sizeCls} ${btnTone} ${className}`}
    >
      Book a demo
      <svg
        width="14"
        height="14"
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
  const t =
    tone === "dark"
      ? "text-paper/80 hover:text-paper focus-visible:ring-paper focus-visible:ring-offset-ink"
      : "text-ink-muted hover:text-ink focus-visible:ring-forest focus-visible:ring-offset-paper";
  return (
    <Link
      href="/review"
      onClick={() => track("see_it_run_click")}
      className={`rounded-sm ${size === "lg" ? "text-base" : "text-sm"} underline decoration-hairline decoration-1 underline-offset-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${t} ${className}`}
    >
      See a worked example
    </Link>
  );
}
