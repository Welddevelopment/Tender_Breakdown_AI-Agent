import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Route protection for the production app (Next 16: this file replaces middleware.ts).
// Marketing surfaces stay public — the landing page, demo scrolly, pitch deck, FAQ and
// showcase are how Bidframe sells itself. Only the working app is gated.
//
// Without Clerk keys (mock/demo build or legacy API mode) this is a passthrough, so
// the public showcase deploy needs no auth config at all.

const isProtectedRoute = createRouteMatcher([
  "/upload(.*)",
  "/review(.*)",
  "/answers(.*)",
  "/graph(.*)",
  "/pack(.*)",
  "/teams(.*)",
  "/tenders(.*)",
  "/api(.*)",
]);

export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) await auth.protect();
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|pdf|mjs)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
