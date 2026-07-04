import type { Metadata } from "next";
import type { Tender } from "@/types/requirement";
import { RequirementsProvider } from "@/context/RequirementsContext";
import { PitchDeck } from "@/components/pitch/PitchDeck";
import bradwellPrebake from "@/data/bradwell-prebake.json";

const demoTender = bradwellPrebake as unknown as Tender;

export const metadata: Metadata = {
  title: "Bidframe pitch",
  description:
    "A three-minute Bidframe pitch deck: deal-breakers first, every line checkable, built from a real pre-baked public-sector tender run.",
  openGraph: {
    title: "Bidframe pitch",
    description:
      "A cinematic, product-led pitch deck for Bidframe's first-read layer for public-sector bids.",
    url: "https://bidframe.org/pitch",
    siteName: "Bidframe",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function PitchPage() {
  return (
    <RequirementsProvider initialTender={demoTender}>
      <PitchDeck />
    </RequirementsProvider>
  );
}
