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
        "/demo/spso-cleaning.pdf",
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
