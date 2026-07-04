import type { Metadata } from "next";
import type { Tender } from "@/types/requirement";
import { RequirementsProvider } from "@/context/RequirementsContext";
import { MatrixView } from "@/components/MatrixView";
import bradwellPrebake from "@/data/bradwell-prebake.json";

// The live product, driven on a frozen real tender (Bradwell grounds ITT). This is the
// ACTUAL interactive tool — the exact same MatrixView as /review — seeded with a pre-baked
// run so it works with NO backend and NO API key (demo-safe: decision controls update local
// state and swallow the failed PATCH). Identical to using the product on a real tender, but
// the results are already computed. This is the stage walkthrough surface. No AuthGate so the
// demo opens instantly.
const demoTender = bradwellPrebake as unknown as Tender;

export const metadata: Metadata = {
  title: "Bidframe — tender walkthrough",
  robots: { index: false },
};

export default function ShowcasePage() {
  return (
    <RequirementsProvider initialTender={demoTender}>
      <MatrixView title={demoTender.title} />
    </RequirementsProvider>
  );
}
