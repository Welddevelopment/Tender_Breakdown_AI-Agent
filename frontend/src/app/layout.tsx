import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { RequirementsProvider } from "@/context/RequirementsContext";

// Bidframe type system (DESIGN-SYSTEM.md §11): Fraunces headings, Chillax body,
// IBM Plex Mono for evidence and source references.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-head",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-ibm",
  display: "swap",
});

// Chillax is Fontshare-only, so it is self-hosted under src/fonts.
const chillax = localFont({
  src: [
    { path: "../fonts/Chillax-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Chillax-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Chillax-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bidframe — Compliance Matrix",
  description:
    "Extract and review tender requirements. Deal-breakers flagged, uncertainty surfaced.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${chillax.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RequirementsProvider>
          <NavBar />
          {children}
        </RequirementsProvider>
      </body>
    </html>
  );
}
