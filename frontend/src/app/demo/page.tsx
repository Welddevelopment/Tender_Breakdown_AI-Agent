import type { Metadata } from "next";
import type { Tender } from "@/types/requirement";
import { RequirementsProvider } from "@/context/RequirementsContext";
import { DemoView } from "@/components/DemoView";
import bradwellPrebake from "@/data/bradwell-prebake.json";
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";

// A non-interactive, read-only showcase of the product (the landing "See the
// demo" links route here). It shows the real matrix + the deal-breaker catch over
// the demo tender, with no upload and no interaction. The interactive product
// stays at /review.
//
// The showcase runs on the pre-baked Bradwell grounds-maintenance run: a real
// extract + autofill in the GET /requirements shape, so /demo shows a real
// tender with no backend and no API key. Its own provider freezes it, so the
// hosted build's live/mock state can't leak in.
const demoTender = bradwellPrebake as unknown as Tender;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Bidframe demo: a public-sector tender, read",
  description:
    "Watch Bidframe read a real public-sector tender: every requirement found, the deal-breakers flagged first, each linked to its source clause. A read-only walkthrough.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    type: "website",
    title: "Bidframe demo: a public-sector tender, read",
    description:
      "Watch Bidframe read a real public-sector tender, flag deal-breakers, and link every requirement to its source clause.",
    url: absoluteUrl("/demo"),
    siteName: "Bidframe",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bidframe demo: a public-sector tender, read",
    description:
      "Watch Bidframe read a real public-sector tender and show the deal-breakers first.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function DemoPage() {
  return (
    <RequirementsProvider initialTender={demoTender}>
      <DemoView />
    </RequirementsProvider>
  );
}
