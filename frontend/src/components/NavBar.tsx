"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/upload", label: "Upload" },
  { href: "/", label: "Matrix" },
  { href: "/answers", label: "Answers" },
  { href: "/graph", label: "Graph" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-hairline bg-paper-raised">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-forest text-xs font-bold text-paper">
            BF
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Bidframe
          </span>
        </div>
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-forest/10 text-forest"
                    : "text-ink-muted hover:bg-paper-raised hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
