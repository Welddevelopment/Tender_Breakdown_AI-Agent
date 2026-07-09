import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import {
  absoluteUrl,
  BOOKING_URL,
  DEFAULT_OG_IMAGE,
  SITE_URL,
} from "@/lib/site";
import { jsonLd } from "@/lib/json-ld";

const title = "Bidframe FAQ: public-sector tender review questions answered";
const description =
  "Plain answers about how Bidframe reads UK public-sector tender packs, flags deal-breakers, shows source clauses, and keeps bid teams in control.";

const FAQ_ITEMS = [
  {
    question: "What is Bidframe?",
    answer:
      "Bidframe is a tender review tool for public-sector bids. It reads a tender pack, turns the requirements into a reviewable worklist, flags deal-breakers, and links each line back to the source clause.",
  },
  {
    question: "Who is Bidframe for?",
    answer:
      "Bidframe is built for SME bidders and small bid-writing consultancies that handle UK public-sector tenders. It helps a stretched bid team do the first read faster without losing control of the final response.",
  },
  {
    question: "Does Bidframe write the bid for you?",
    answer:
      "No. Bidframe drafts suggested answers from your own documents and shows where each claim came from. You approve, edit, or flag every line before it goes into the bid.",
  },
  {
    question: "How does Bidframe catch deal-breakers?",
    answer:
      "Bidframe looks for pass or fail requirements, exclusion grounds, minimum standards, submission rules, required forms, and other clauses that can disqualify a bid. It puts those deal-breakers first so they are not buried in the tender pack.",
  },
  {
    question: "How does source checking work?",
    answer:
      "Each requirement keeps its page, clause, and source excerpt. When Bidframe drafts an answer, it also shows the bidder document and excerpt behind the claim, so a reviewer can check the evidence before approving it.",
  },
  {
    question: "What happens when Bidframe is not sure?",
    answer:
      "Uncertain requirements stay visible. Bidframe marks them for review, asks for missing information where needed, and avoids presenting a guess as a finished answer.",
  },
  {
    question: "Can Bidframe read UK public-sector tender packs?",
    answer:
      "Yes. The demo uses a real UK public-sector tender run. Bidframe accepts PDF, Word, Excel and CSV tender documents, then shows each requirement with its filename, locator and source excerpt.",
  },
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    type: "website",
    title,
    description,
    url: absoluteUrl("/faq"),
    siteName: "Bidframe",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_OG_IMAGE],
  },
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE_URL}/faq#faq`,
  mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-paper paper-grid">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqStructuredData) }}
      />

      <SiteHeader />

      <main className="mx-auto w-full max-w-[980px] px-6 py-16 sm:py-24">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-forest">
          Bidframe FAQ
        </p>
        <h1 className="mt-3 max-w-[15ch] font-serif text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
          Questions before you trust the record
        </h1>
        <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-ink-muted sm:text-xl">
          Bidframe is built for the first read of a UK public-sector tender:
          requirements found, deal-breakers shown first, and source clauses kept
          close enough to check.
        </p>

        <dl className="mt-14 border-t-2 border-ink">
          {FAQ_ITEMS.map(({ question, answer }) => (
            <div
              key={question}
              className="grid gap-4 border-b border-hairline py-8 md:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] md:gap-12"
            >
              <dt className="font-serif text-2xl font-semibold leading-snug tracking-tight text-ink">
                {question}
              </dt>
              <dd className="text-lg leading-relaxed text-ink-muted">
                {answer}
              </dd>
            </div>
          ))}
        </dl>

        <section className="mt-14 border-t border-hairline pt-8">
          <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-ink">
            See it against a real tender
          </h2>
          <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-ink-muted">
            The public demo shows Bidframe reading a real tender with no upload
            needed. For a live walkthrough, bring one tender you have already
            bid.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href="/demo"
              className="rounded-sm text-base text-forest underline decoration-forest/30 decoration-1 underline-offset-4 transition-colors hover:text-forest-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              See it run
            </Link>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm text-base text-ink-muted underline decoration-hairline decoration-1 underline-offset-4 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Book a demo
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
