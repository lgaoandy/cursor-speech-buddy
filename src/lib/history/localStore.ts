import type { HistoryEntry } from "@/types/speech";
import type { HistoryStore } from "./types";

const STORAGE_KEY = "speech-buddy:history";
const MAX_ENTRIES = 20;

function readRaw(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeRaw(entries: HistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const localStore: HistoryStore = {
  async getAll() {
    return readRaw();
  },

  async save(entry) {
    const entries = readRaw();
    // Newest first; cap at MAX_ENTRIES to stay well under localStorage 5 MB limit
    const updated = [entry, ...entries].slice(0, MAX_ENTRIES);
    writeRaw(updated);
  },

  async delete(id) {
    writeRaw(readRaw().filter((e) => e.id !== id));
  },

  async clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
