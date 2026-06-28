interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="border-b border-hairline bg-paper-raised">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest text-sm font-bold text-paper">
            BF
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">
              Bidframe
            </h1>
            <p className="text-xs text-ink-muted">
              Compliance matrix · mock data
            </p>
          </div>
        </div>
        <div className="mt-3">
          <h2 className="text-base font-medium text-ink">{title}</h2>
          {subtitle && (
            <p className="text-sm text-ink-muted">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
