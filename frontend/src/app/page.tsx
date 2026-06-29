import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

// The public landing page lives at the app root so it inherits the design
// tokens and fonts, and the CTAs flow into the live product. The demo matrix
// now lives at /review (landing-page-brief §5). The composition is in
// components/landing/Landing.tsx.
export const metadata: Metadata = {
  title: "Bidframe — never lose a bid to a deal-breaker you missed",
  description:
    "Bidframe reads a public-sector tender, finds every requirement, flags the deal-breakers that would disqualify you, and links each to its source clause. Built for SME bidders and small bid-writing consultancies.",
  openGraph: {
    title: "Bidframe — never lose a bid to a deal-breaker you missed",
    description:
      "Bidframe reads a public-sector tender, finds every requirement, flags the deal-breakers that would disqualify you, and links each to its source clause. Built for SME bidders and small bid-writing consultancies.",
  },
};

export default function Page() {
  return <Landing />;
}
