import { Header } from "@/components/Header";
import { MatrixView } from "@/components/MatrixView";
import { mockTender } from "@/data/mock-requirements";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-paper">
      <Header
        title={mockTender.title}
        subtitle={`${mockTender.requirements.length} requirements extracted · Day 1 compliance matrix`}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <MatrixView />
      </main>
    </div>
  );
}
