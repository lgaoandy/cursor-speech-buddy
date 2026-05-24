const API_URL = import.meta.env.VITE_API_URL ?? "";

const GUEST_TOS_KEY = "speech-buddy:tos";

export interface TosContent {
  version: string;
  content: string;
}

export interface TosStatus {
  accepted: boolean;
  version: string | null;
}

interface GuestTosRecord {
  version: string;
  acceptedAt: string;
}

// ---------- API helpers (authenticated users) ----------

export async function fetchTos(): Promise<TosContent> {
  const res = await fetch(`${API_URL}/tos`);
  if (!res.ok) throw new Error(`Failed to load Terms of Service (${res.status})`);
  return res.json() as Promise<TosContent>;
}

export async function acceptTos(): Promise<void> {
  const res = await fetch(`${API_URL}/tos/accept`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to record ToS acceptance (${res.status})`);
  }
}

// ---------- Guest localStorage helpers ----------

export function getGuestTosAcceptance(): GuestTosRecord | null {
  try {
    const raw = localStorage.getItem(GUEST_TOS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestTosRecord;
  } catch {
    return null;
  }
}

export function setGuestTosAcceptance(version: string): void {
  const record: GuestTosRecord = { version, acceptedAt: new Date().toISOString() };
  localStorage.setItem(GUEST_TOS_KEY, JSON.stringify(record));
}

export function clearGuestTosAcceptance(): void {
  localStorage.removeItem(GUEST_TOS_KEY);
}

/** Returns true if the guest has accepted the given ToS version locally. */
export function guestHasAcceptedVersion(version: string): boolean {
  return getGuestTosAcceptance()?.version === version;
}
