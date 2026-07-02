import Link from "next/link";

import { BrandLogo } from "@/components/BrandLogo";
import { BookDemoButton } from "@/components/landing/BookDemoButton";
import { PineBranch } from "@/components/landing/art/PineBranch";
import { Seal } from "@/components/landing/art/Seal";
import { TreelineDivider } from "@/components/landing/art/TreelineDivider";

// The site foot as a destination rather than an afterthought: a second,
// nearer treeline drops the page from the pine closing band onto the deeper
// pine-deep ground, where the reversed brand lockup sits large beside the
// engraved seal. Beneath them, the audience line, a small set of quiet
// paper-toned links, and a mono running foot. No invented email or
// overclaims, only what the page already stands behind. Everything textual
// holds at paper/60 or stronger, which clears AA on pine-deep.
const CONTAINER = "mx-auto w-full max-w-[1160px] px-6";

const linkClass =
  "rounded-sm text-sm text-paper/70 underline decoration-paper/40 decoration-1 underline-offset-4 transition-colors hover:text-paper hover:decoration-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-pine-deep";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden text-paper">
      {/* the divider's own background paints the pine of the closing band
          above, so the pine-deep trees read as a nearer ridge in front of it */}
      <TreelineDivider
        flip
        className="-mb-px block h-14 w-full bg-pine text-pine-deep sm:h-24"
      />
      <div className="relative bg-pine-deep">
        <PineBranch
          className="pointer-events-none absolute -right-16 top-8 hidden h-56 w-auto rotate-[16deg] text-paper/[0.07] lg:block"
        />
        <Seal
          id="seal-footer-watermark"
          className="pointer-events-none absolute left-[7%] bottom-8 hidden h-44 w-44 -rotate-[9deg] text-paper/[0.05] lg:block"
        />
        <div className={`${CONTAINER} relative py-14 sm:py-16`}>
          <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-10">
            <div>
              <BrandLogo reversed className="h-10 w-auto sm:h-12" />
              <p className="mt-4 max-w-[34ch] text-sm text-paper/70">
                For SME bidders and small bid-writing consultancies.
              </p>
              <nav
                aria-label="Footer"
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
              >
                <Link href="/demo" className={linkClass}>
                  See the demo
                </Link>
                <Link href="/login" className={linkClass}>
                  Sign in
                </Link>
                <BookDemoButton variant="link" tone="pine" location="footer" />
              </nav>
            </div>
            <Seal
              id="seal-footer"
              className="relative h-28 w-28 text-paper/75 sm:h-32 sm:w-32"
            />
          </div>
          <p className="mt-12 border-t border-paper/15 pt-6 font-mono text-xs tracking-[0.2em] text-paper/60">
            BIDFRAME
          </p>
        </div>
      </div>
    </footer>
  );
}
