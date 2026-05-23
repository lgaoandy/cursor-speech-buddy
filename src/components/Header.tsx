export function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Human Intelligence Lab
          </p>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Speech Buddy
          </h1>
        </div>
        <p className="hidden text-sm text-[var(--muted)] sm:block">
          Practice · Analyze · Improve
        </p>
      </div>
    </header>
  );
}
