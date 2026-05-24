import { indexedStore } from "./indexedStore";
import { createCloudStore } from "./cloudStore";
import type { HistoryStore } from "./types";

/**
 * Returns the appropriate history store based on auth state.
 *
 * Option A: localStore      — localStorage only, no audio
 * Option B: indexedStore    — IndexedDB + audio blob storage
 * Option C: createCloudStore — Firestore + Google Drive (signed-in users)
 *
 * Guest users and signed-out state fall back to indexedStore (device-local).
 */
export function getHistoryStore(signedIn: boolean): HistoryStore {
  return signedIn ? createCloudStore() : indexedStore;
}

export type { HistoryStore } from "./types";
