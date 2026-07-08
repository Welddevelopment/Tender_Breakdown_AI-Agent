import { OrganizationProfile } from "@clerk/nextjs";
import { AppMain } from "@/components/AppMain";
import { AuthGate } from "@/components/AuthGate";
import { DocumentHeader } from "@/components/DocumentHeader";
import { TeamsManager } from "@/components/TeamsManager";

export const metadata = { title: "Teams · Bidframe" };

// Production: the team IS the Clerk organisation, so this page is Clerk's own
// member-management surface — email invites, roles, removal, all maintained by
// Clerk rather than us. Legacy/mock builds keep the hand-built TeamsManager
// until cutover.
export default function TeamsPage() {
  const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <AuthGate>
      <DocumentHeader title="Your team" showReference={false} />
      <AppMain>
        {clerkEnabled ? (
          <div className="mx-auto flex max-w-4xl justify-center pt-6">
            <OrganizationProfile routing="hash" />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl pt-6">
            <p className="mb-8 max-w-[62ch] text-sm leading-relaxed text-ink-muted">
              Add teammates once, then share tenders with the whole team.
            </p>
            <TeamsManager />
          </div>
        )}
      </AppMain>
    </AuthGate>
  );
}
