"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A quiet section switcher that lives in the header, not a left rail
// (layout.md section 1: "if a view switcher is ever genuinely needed, it lives
// in the header"). Plain text links, middot separated, the current section
// marked by weight and a thin forest underline. No pills, no icons, no filled
// tab, nothing that reads as a dashboard nav.

// The four working sections. Tender = /upload: pick which tender to work in (or
// add a new pack). Bid = /answers: the response with readiness and export.
// Matrix = /review: requirement review. Marks = /graph: award criteria and
// structure. With no tender selected, Bid/Matrix/Marks show the recovery state.
// (Teams — a global collaboration destination, not a per-tender view — lives in the
// account control, not this section switcher.)
const SECTIONS = [
  { href: "/upload", label: "Tender" },
  { href: "/answers", label: "Bid" },
  { href: "/review", label: "Matrix" },
  { href: "/graph", label: "Marks" },
];

export function SectionNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav aria-label="Sections" className="flex items-center gap-2 text-xs">
      {SECTIONS.map((section, i) => (
        <span key={section.href} className="flex items-center gap-2">
          {i > 0 && (
            <span aria-hidden className="text-hairline">
              ·
            </span>
          )}
          <Link
            href={section.href}
            aria-current={isActive(section.href) ? "page" : undefined}
            className={
              isActive(section.href)
                ? "font-medium text-ink underline decoration-forest decoration-2 underline-offset-4"
                : "text-ink-muted transition-colors hover:text-ink"
            }
          >
            {section.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
