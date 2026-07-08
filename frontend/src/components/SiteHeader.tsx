"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "./AccountMenu";
import { BrandLogo } from "./BrandLogo";
import { SectionNav } from "./SectionNav";
import { BookDemoButton } from "./landing/BookDemoButton";

// The one site masthead. Every page — landing, demo, FAQ, thank-you, login, and
// the product — renders this same fixed-height bar: the Bidframe lockup on the
// left, at most four quiet links on the right, and the one 2px ink rule
// beneath. Page titles never live in this bar (they get a title row below it),
// so nothing here can truncate.
//
// Two variants:
// - "marketing": See the demo · Sign in · Book a demo. Sticky, translucent
//   paper over a blur, the same letterhead on every public page.
// - "app": the SectionNav (Tender · Bid · Matrix · Marks) and the quiet account
//   control. NOT sticky — the app's fullscreen overlays (FocusMode,
//   SourceVerifyOverlay) sit at z-60, below the masthead's z-80, so a sticky
//   app bar would float over them.

const MARKETING_LINKS = [
  { href: "/demo", label: "See the demo" },
  { href: "/login", label: "Sign in" },
];

export function SiteHeader({
  variant = "marketing",
}: {
  variant?: "marketing" | "app";
}) {
  const pathname = usePathname();
  const isApp = variant === "app";

  return (
    <header
      className={
        isApp
          ? "border-b-2 border-ink bg-paper"
          : "landing-masthead sticky border-b-2 border-ink bg-paper/90 backdrop-blur-sm"
      }
    >
      <div className="mx-auto flex h-16 w-full max-w-[1160px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={isApp ? "/upload" : "/"}
          aria-label="Bidframe home"
          className="shrink-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <BrandLogo className="h-9 w-auto sm:h-10" />
        </Link>

        {isApp ? (
          <div className="flex items-center gap-4 sm:gap-6">
            <SectionNav />
            <AccountMenu />
          </div>
        ) : (
          <nav aria-label="Site" className="flex items-center gap-3 sm:gap-5">
            {MARKETING_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={
                  pathname === link.href
                    ? "hidden rounded-sm text-sm font-medium text-ink underline decoration-forest decoration-2 underline-offset-4 sm:inline"
                    : "link-draw hidden rounded-sm text-sm text-ink-muted transition-colors hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:inline"
                }
              >
                {link.label}
              </Link>
            ))}
            <BookDemoButton location="masthead" className="shrink-0" />
          </nav>
        )}
      </div>
    </header>
  );
}
