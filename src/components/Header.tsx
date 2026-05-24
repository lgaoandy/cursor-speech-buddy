import { useEffect, useState } from "react";
import { getHistoryStore } from "@/lib/history";
import { AuthButton } from "@/components/AuthButton";
import type { GoogleUser } from "@/lib/auth";

interface HeaderProps {
  user: GoogleUser | null;
  isGuest: boolean;
  onHistoryClick: () => void;
  onSignedOut: () => void;
}

export function Header({ user, isGuest, onHistoryClick, onSignedOut }: HeaderProps) {
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    const store = getHistoryStore(user !== null);
    store.getAll().then((entries) => setHistoryCount(entries.length));
  }, [user]);

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 2a4 4 0 0 1 4 4c0 2.5-1.5 4.5-4 6C5.5 10.5 4 8.5 4 6a4 4 0 0 1 4-4Z" fill="var(--accent-fg)" fillOpacity="0.9" />
              <circle cx="8" cy="6" r="1.5" fill="var(--accent-fg)" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--foreground)]">
              Speech Buddy
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--muted)]">
              Human Intelligence Lab
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHistoryClick}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-alt)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-white"
          >
            History
            {historyCount > 0 && (
              <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--accent-fg)]">
                {historyCount}
              </span>
            )}
          </button>
          <AuthButton user={user} isGuest={isGuest} onSignedOut={onSignedOut} />
        </div>
      </div>
    </header>
  );
}
