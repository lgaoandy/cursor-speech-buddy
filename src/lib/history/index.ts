import { indexedStore } from "./indexedStore";
import { createCloudStore } from "./cloudStore";
import type { HistoryStore } from "./types";

/**
 * Returns the appropriate history store based on auth state.
 *
 * - Signed-in users  → cloudStore  (Firestore entries + Drive audio)
 * - Guests / signed-out → indexedStore (device-local IndexedDB + audio blobs)
 */
export function getHistoryStore(signedIn: boolean): HistoryStore {
  return signedIn ? createCloudStore() : indexedStore;
}

export type { HistoryStore } from "./types";
