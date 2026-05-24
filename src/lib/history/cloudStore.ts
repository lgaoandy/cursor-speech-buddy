import type { HistoryEntry } from "@/types/speech";
import type { HistoryStore } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * Cloud-backed HistoryStore for signed-in users.
 * Entries stored in Firestore, audio in Google Drive.
 * All fetch calls include credentials so the session cookie is sent.
 */
export function createCloudStore(): HistoryStore {
  return {
    async getAll() {
      const res = await fetch(`${API_URL}/history`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch history.");
      return res.json() as Promise<HistoryEntry[]>;
    },

    async save(entry) {
      const form = new FormData();
      form.append("entry", JSON.stringify(entry));
      const res = await fetch(`${API_URL}/history`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save history entry.");
    },

    async delete(id) {
      const res = await fetch(`${API_URL}/history/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete history entry.");
    },

    async clear() {
      const res = await fetch(`${API_URL}/history`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to clear history.");
    },

    async saveAudio(entryId, blob) {
      const form = new FormData();
      // Re-save the entry JSON alongside audio so the server can attach the Drive URL
      form.append("audio", blob, `${entryId}.webm`);
      const res = await fetch(`${API_URL}/history/${entryId}/audio`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.warn("[cloudStore] Audio upload failed:", res.status, body);
      }
    },

    async getAudioUrl(entryId) {
      const res = await fetch(`${API_URL}/history/${entryId}/audio-url`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { url: string | null };
      return data.url;
    },
  };
}
