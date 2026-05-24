import type { HistoryEntry } from "@/types/speech";

/**
 * Storage adapter interface for session history. All methods are async so
 * implementations can be swapped freely (IndexedDB locally, REST API in the
 * cloud) without changes outside this folder.
 *
 * Audio methods are optional — implementations that don't persist audio (e.g.
 * a hypothetical localStorage-only fallback) can omit them.
 */
export interface HistoryStore {
  getAll(): Promise<HistoryEntry[]>;
  save(entry: HistoryEntry): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;

  saveAudio?(entryId: string, blob: Blob): Promise<void>;
  getAudioUrl?(entryId: string): Promise<string | null>;
}
