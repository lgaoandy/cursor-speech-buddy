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
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Human Intelligence Lab
          </p>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Speech Buddy
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHistoryClick}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent-muted)] transition-colors"
          >
            History
            {historyCount > 0 && (
              <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-xs font-semibold text-white">
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
