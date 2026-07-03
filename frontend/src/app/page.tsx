import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";
import { jsonLd } from "@/lib/json-ld";

// The public landing page lives at the app root so it inherits the design
// tokens and fonts, and the CTAs flow into the live product. The demo matrix
// now lives at /review (landing-page-brief §5). The composition is in
// components/landing/Landing.tsx.
const title = "Bidframe: never lose a bid to a deal-breaker you missed";
const description =
  "Bidframe reads a public-sector tender, finds every requirement, flags the deal-breakers that would disqualify you, and links each to its source clause. Built for SME bidders and small bid-writing consultancies.";

// Static social preview built from the landing page forest visual.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title,
    description,
    url: absoluteUrl("/"),
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

const homepageStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Bidframe",
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
    description:
      "Bidframe helps SME bidders and small bid-writing consultancies review UK public-sector tenders, catch disqualifying requirements, and check every line against the source clause.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Bidframe",
    url: SITE_URL,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en-GB",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: "Bidframe",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description,
    audience: {
      "@type": "Audience",
      audienceType: "SME bidders and small bid-writing consultancies",
    },
    featureList: [
      "Extracts tender requirements from public-sector PDFs",
      "Flags deal-breakers and uncertain requirements for review",
      "Links requirements and drafted answers back to source evidence",
      "Keeps the bidder in control of every approved line",
    ],
  },
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(homepageStructuredData) }}
      />
      <Landing />
    </>
  );
}
