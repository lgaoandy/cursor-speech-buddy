import { openDB } from "idb";
import type { IDBPDatabase } from "idb";
import type { HistoryEntry } from "@/types/speech";
import type { HistoryStore } from "./types";

const DB_NAME = "speech-buddy-db";
const DB_VERSION = 1;
const STORE_ENTRIES = "entries";
const STORE_AUDIO = "audio";
const MAX_ENTRIES = 20;
const LEGACY_LS_KEY = "speech-buddy:history";

type SpeechBuddyDB = {
  [STORE_ENTRIES]: {
    key: string;
    value: HistoryEntry;
    indexes: { createdAt: string };
  };
  [STORE_AUDIO]: {
    key: string;
    value: Blob;
  };
};

function openSpeechDB(): Promise<IDBPDatabase<SpeechBuddyDB>> {
  return openDB<SpeechBuddyDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const entryStore = db.createObjectStore(STORE_ENTRIES, { keyPath: "id" });
      entryStore.createIndex("createdAt", "createdAt");
      db.createObjectStore(STORE_AUDIO);
    },
  });
}

/**
 * Migrate any entries saved by Option A (localStorage) into IndexedDB.
 * Runs once on first use; safe to call multiple times.
 */
async function migrateFromLocalStorage(
  db: IDBPDatabase<SpeechBuddyDB>,
): Promise<void> {
  const raw = localStorage.getItem(LEGACY_LS_KEY);
  if (!raw) return;
  try {
    const entries = JSON.parse(raw) as HistoryEntry[];
    const tx = db.transaction(STORE_ENTRIES, "readwrite");
    await Promise.all(entries.map((e) => tx.store.put(e)));
    await tx.done;
    localStorage.removeItem(LEGACY_LS_KEY);
  } catch {
    // Migration failed — leave localStorage intact so data isn't lost
  }
}

let dbPromise: Promise<IDBPDatabase<SpeechBuddyDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SpeechBuddyDB>> {
  if (!dbPromise) {
    dbPromise = openSpeechDB().then(async (db) => {
      await migrateFromLocalStorage(db);
      return db;
    });
  }
  return dbPromise;
}

export const indexedStore: HistoryStore = {
  async getAll() {
    const db = await getDB();
    // getAll returns insertion order; we want newest first
    const all = await db.getAll(STORE_ENTRIES);
    return all.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async save(entry) {
    const db = await getDB();
    await db.put(STORE_ENTRIES, entry);

    // Enforce MAX_ENTRIES — delete oldest beyond the cap
    const all = await db.getAllKeys(STORE_ENTRIES);
    if (all.length > MAX_ENTRIES) {
      const entries = await db.getAll(STORE_ENTRIES);
      const sorted = entries.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const toDelete = sorted.slice(0, entries.length - MAX_ENTRIES);
      const tx = db.transaction([STORE_ENTRIES, STORE_AUDIO], "readwrite");
      await Promise.all(
        toDelete.flatMap((e) => [
          tx.objectStore(STORE_ENTRIES).delete(e.id),
          tx.objectStore(STORE_AUDIO).delete(e.id),
        ]),
      );
      await tx.done;
    }
  },

  async delete(id) {
    const db = await getDB();
    const tx = db.transaction([STORE_ENTRIES, STORE_AUDIO], "readwrite");
    await Promise.all([
      tx.objectStore(STORE_ENTRIES).delete(id),
      tx.objectStore(STORE_AUDIO).delete(id),
    ]);
    await tx.done;
  },

  async clear() {
    const db = await getDB();
    const tx = db.transaction([STORE_ENTRIES, STORE_AUDIO], "readwrite");
    await Promise.all([
      tx.objectStore(STORE_ENTRIES).clear(),
      tx.objectStore(STORE_AUDIO).clear(),
    ]);
    await tx.done;
  },

  async saveAudio(entryId, blob) {
    const db = await getDB();
    await db.put(STORE_AUDIO, blob, entryId);
  },

  async getAudioUrl(entryId) {
    const db = await getDB();
    const blob = await db.get(STORE_AUDIO, entryId);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  },
};
