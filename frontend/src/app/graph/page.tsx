import { AppMain } from "@/components/AppMain";
import { AuthGate } from "@/components/AuthGate";
import { DocumentHeader } from "@/components/DocumentHeader";
import { GraphView } from "@/components/GraphView";

export const metadata = { title: "Graph · Bidframe" };

export default function GraphPage() {
  return (
    <AuthGate>
      <DocumentHeader title="Requirement relationships" />
      <AppMain>
        <GraphView />
      </AppMain>
    </AuthGate>
  );
}
