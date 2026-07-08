import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Newsreader } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { RequirementsProvider } from "@/context/RequirementsContext";
import { clerkEnabled } from "@/lib/env";
import { SITE_URL } from "@/lib/site";

// Bidframe type system (DESIGN-SYSTEM.md §11): Fraunces headings, Chillax body,
// IBM Plex Mono for evidence and source references.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-head",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-hero",
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
  // Production auth: ClerkProvider wraps the tree only when Clerk is configured, so
  // the mock/legacy builds render exactly as before with zero auth dependencies.
  const providers = (
    <AuthProvider>
      <RequirementsProvider>{children}</RequirementsProvider>
    </AuthProvider>
  );

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} ${chillax.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper">
        {clerkEnabled ? <ClerkProvider>{providers}</ClerkProvider> : providers}
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
