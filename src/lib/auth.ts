import type { TosStatus } from "@/lib/tos";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const GUEST_KEY = "speech-buddy:auth-choice";

export interface GoogleUser {
  googleId: string;
  name: string;
  email: string;
  avatarUrl: string;
  tosStatus: TosStatus;
}

export async function getCurrentUser(): Promise<GoogleUser | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as Omit<GoogleUser, "tosStatus"> & {
      tosStatus?: TosStatus;
    };
    // Default to not accepted if the field is missing (e.g. Firestore read failed)
    return {
      ...data,
      tosStatus: data.tosStatus ?? { accepted: false, version: null },
    };
  } catch {
    return null;
  }
}

export function signInWithGoogle(): void {
  window.location.href = `${API_URL}/auth/google`;
}

export async function signOut(): Promise<void> {
  if (!API_URL) return;
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

/** Returns true if the user has previously made an auth choice (sign-in or guest). */
export function hasAuthChoice(): boolean {
  return localStorage.getItem(GUEST_KEY) !== null;
}

export function setGuestChoice(): void {
  localStorage.setItem(GUEST_KEY, "guest");
}

export function clearAuthChoice(): void {
  localStorage.removeItem(GUEST_KEY);
}
