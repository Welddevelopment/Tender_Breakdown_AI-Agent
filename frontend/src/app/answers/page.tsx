import { GapInterview } from "@/components/GapInterview";
import { Header } from "@/components/Header";

export const metadata = { title: "Answers — Bidframe" };

export default function AnswersPage() {
  return (
    <div className="flex min-h-full flex-col bg-paper">
      <Header
        title="Auditable autofill"
        subtitle="Grounded draft answers and the open questions the tool needs you to resolve"
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <GapInterview />
      </main>
    </div>
  );
}
