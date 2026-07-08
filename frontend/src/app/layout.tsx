import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { RequirementsProvider } from "@/context/RequirementsContext";
import { SITE_URL } from "@/lib/site";

// Bidframe type system (DESIGN-SYSTEM.md §11): Fraunces headings, Chillax body,
// IBM Plex Mono for evidence and source references.
//
// All three Google Fonts are self-hosted as woff2 under src/fonts/ so that the
// production build never depends on the Google CDN (which can hang or be blocked
// in CI / restricted networks). Same variable names, weights, and display strategy
// as before — no CSS or component changes required.
const fraunces = localFont({
  src: [
    // Fraunces is a variable font; one file covers the full 500–700 weight range.
    { path: "../fonts/Fraunces-500-700.woff2", weight: "500 700", style: "normal" },
  ],
  variable: "--font-head",
  display: "swap",
});

const newsreader = localFont({
  src: [
    { path: "../fonts/Newsreader-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-hero",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "../fonts/IBMPlexMono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/IBMPlexMono-500.woff2", weight: "500", style: "normal" },
  ],
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
  metadataBase: new URL(SITE_URL),
  applicationName: "Bidframe",
  title: "Bidframe · Compliance Matrix",
  description:
    "Extract and review tender requirements. Deal-breakers flagged, uncertainty surfaced.",
  icons: {
    icon: { url: "/icon.svg", type: "image/svg+xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} ${chillax.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper">
        <AuthProvider>
          <RequirementsProvider>{children}</RequirementsProvider>
        </AuthProvider>
        {/* Undo toasts for decisions + save-failure notices, restyled from
            sonner's defaults into the register: raised paper on a hairline
            rule, mono small text; an error carries the oxblood reading edge. */}
        <Toaster
          position="bottom-center"
          gap={8}
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                "surface-grain pointer-events-auto flex w-[356px] max-w-full items-center gap-3 rounded-lg border border-hairline bg-paper-raised px-4 py-3 shadow-[var(--depth-sheet)]",
              title: "font-mono text-xs leading-snug text-ink",
              description: "font-mono text-[11px] leading-snug text-ink-muted",
              actionButton:
                "ml-auto shrink-0 rounded-md border border-hairline bg-paper px-2 py-1 font-mono text-[11px] font-medium text-ink shadow-[var(--depth-control)] transition-colors hover:text-forest",
              cancelButton:
                "ml-auto shrink-0 font-mono text-[11px] text-ink-muted transition-colors hover:text-ink",
              error: "border-l-2 border-l-signal-oxblood-frame",
            },
          }}
        />
      </body>
    </html>
  );
}
