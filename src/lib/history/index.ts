import { localStore } from "./localStore";
import type { HistoryStore } from "./types";

/**
 * Active history store.
 *
 * Option A: localStorage (current)
 * Option B: swap localStore for indexedStore (add audio blob support)
 * Option C: swap for cloudStore(user) when Google auth is available
 */
export const historyStore: HistoryStore = localStore;

export type { HistoryStore } from "./types";
export type { } from "./localStore";
