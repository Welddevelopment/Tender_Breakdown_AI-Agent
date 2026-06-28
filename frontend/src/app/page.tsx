import { ComplianceMatrix } from "@/components/ComplianceMatrix";
import { Header } from "@/components/Header";
import { mockTender } from "@/data/mock-requirements";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <Header
        title={mockTender.title}
        subtitle={`${mockTender.requirements.length} requirements extracted · Day 1 compliance matrix`}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <ComplianceMatrix requirements={mockTender.requirements} />
      </main>
    </div>
  );
}
