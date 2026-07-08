import { SignIn } from "@clerk/nextjs";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "Sign in · Bidframe" };

// Production sign-in: Clerk's hosted component (Google + email, MFA-capable). The
// legacy /login page redirects here when Clerk is configured; without Clerk keys this
// route isn't linked from anywhere.
export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper paper-grid">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <SignIn />
      </main>
    </div>
  );
}
