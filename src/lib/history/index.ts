import { indexedStore } from "./indexedStore";
import type { HistoryStore } from "./types";

/**
 * Active history store.
 *
 * Option A: localStore  — localStorage only, no audio
 * Option B: indexedStore — IndexedDB + audio blob storage (current)
 * Option C: swap for cloudStore(user) when Google auth is available
 */
export const historyStore: HistoryStore = indexedStore;

export type { HistoryStore } from "./types";
