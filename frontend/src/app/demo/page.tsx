import type { Metadata } from "next";
import { DemoView } from "@/components/DemoView";

// A non-interactive, read-only showcase of the product (the landing "See the
// demo" links route here). It shows the real matrix + the deal-breaker catch over
// the demo tender, with no upload and no interaction. The interactive product
// stays at /review.
export const metadata: Metadata = {
  title: "Bidframe demo: a public-sector tender, read",
  description:
    "Watch Bidframe read a real public-sector tender: every requirement found, the deal-breakers flagged first, each linked to its source clause. A read-only walkthrough.",
};

export default function DemoPage() {
  return <DemoView />;
}
