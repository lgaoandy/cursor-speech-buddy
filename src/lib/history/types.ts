import type { HistoryEntry } from "@/types/speech";

/**
 * Storage adapter interface for session history.
 *
 * All methods are async so swapping localStorage for a cloud API (Option C)
 * requires no changes outside this folder — just add a new implementation
 * and update index.ts to export it.
 */
export interface HistoryStore {
  getAll(): Promise<HistoryEntry[]>;
  save(entry: HistoryEntry): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;

  // Option B — audio blob storage (optional so localStore keeps working as-is)
  saveAudio?(entryId: string, blob: Blob): Promise<void>;
  getAudioUrl?(entryId: string): Promise<string | null>;
}
