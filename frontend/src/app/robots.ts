import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/demo", "/faq", "/og.png", "/icon.svg"],
      disallow: [
        "/answers",
        "/codemap.html",
        "/demo/bradwell-grounds-itt.pdf",
        "/demo/spso-cleaning.pdf",
        "/demo/mixed-pack/",
        "/graph",
        "/login",
        "/pdf.worker.min.mjs",
        "/pitch",
        "/review",
        "/tenders",
        "/thank-you",
        "/upload",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
