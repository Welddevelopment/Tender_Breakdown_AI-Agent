import type { ReactNode } from "react";

export function StageChrome({
  children,
  url = "bidframe.app/review",
}: {
  children: ReactNode;
  url?: string;
}) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-hairline bg-paper-raised shadow-[var(--depth-sheet)]">
      <div className="flex h-7 items-center gap-2 border-b border-hairline bg-paper px-3">
        <span className="h-2 w-2 rounded-full bg-signal-oxblood/80" />
        <span className="h-2 w-2 rounded-full bg-accent/70" />
        <span className="h-2 w-2 rounded-full bg-forest/70" />
        <span className="ml-2 rounded-sm border border-hairline bg-paper-recessed px-2 py-0.5 font-mono text-[10px] text-ink-muted">
          {url}
        </span>
      </div>
      <div className="bg-paper">{children}</div>
    </div>
  );
}
