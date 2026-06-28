import { GraphView } from "@/components/GraphView";
import { Header } from "@/components/Header";

export const metadata = { title: "Graph — Bidframe" };

export default function GraphPage() {
  return (
    <div className="flex min-h-full flex-col bg-paper">
      <Header
        title="Requirement relationship graph"
        subtitle="Requirements linked to award criteria and their dependencies · gating items lit up"
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <GraphView />
      </main>
    </div>
  );
}
