"use client";

import { ActivityControl } from "./ActivityControl";
import { ShareControl } from "./ShareControl";

// The workspace header's collaboration cluster: who has access (ShareControl is
// both the member avatar strip and the Share-tender trigger) and the team's
// activity trail (ActivityControl). Both self-gate to the live app with a tender
// loaded — ShareControl needs a backend, ActivityControl needs recorded activity
// — so when neither renders, the wrapper is empty and `empty:hidden` removes it,
// leaving API-off surfaces (frozen worked-example, hero embed, /demo) unchanged.
// Promoted out of the /review body into DocumentHeader so team access is visible
// on every app route (UI Stage 2), not just the matrix.
export function WorkspacePresence() {
  return (
    <div className="flex items-center gap-2 empty:hidden">
      <ShareControl />
      <ActivityControl />
    </div>
  );
}
