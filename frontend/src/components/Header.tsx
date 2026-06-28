interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            BF
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Bidframe
            </h1>
            <p className="text-xs text-slate-500">
              Compliance matrix · mock data
            </p>
          </div>
        </div>
        <div className="mt-3">
          <h2 className="text-base font-medium text-slate-800">{title}</h2>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
