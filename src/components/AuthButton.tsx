import { useState } from "react";
import { signInWithGoogle, signOut } from "@/lib/auth";
import type { GoogleUser } from "@/lib/auth";

interface AuthButtonProps {
  user: GoogleUser | null;
  isGuest: boolean;
  onSignedOut: () => void;
}

export function AuthButton({ user, isGuest, onSignedOut }: AuthButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    onSignedOut();
  };

  if (user) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm hover:bg-[var(--accent-muted)] transition-colors"
          aria-expanded={menuOpen}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="hidden max-w-[120px] truncate sm:block">{user.name}</span>
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
              <p className="truncate px-3 py-2 text-xs text-[var(--muted)]">
                {user.email}
              </p>
              <hr className="border-[var(--border)]" />
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--accent-muted)] transition-colors"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (isGuest) {
    return (
      <button
        type="button"
        onClick={signInWithGoogle}
        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--accent-muted)] transition-colors"
      >
        Sign in to sync
      </button>
    );
  }

  return null;
}
