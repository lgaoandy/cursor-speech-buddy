import { firestore } from "./firebase";
import type { HistoryEntry } from "../types/speech";

const MAX_ENTRIES = 20;

function userHistoryRef(userId: string) {
  return firestore().collection("users").doc(userId).collection("history");
}

export async function getHistory(userId: string): Promise<HistoryEntry[]> {
  const snapshot = await userHistoryRef(userId)
    .orderBy("createdAt", "desc")
    .limit(MAX_ENTRIES)
    .get();
  return snapshot.docs.map((doc) => doc.data() as HistoryEntry);
}

export async function saveEntry(
  userId: string,
  entry: HistoryEntry,
): Promise<void> {
  await userHistoryRef(userId).doc(entry.id).set(entry);

  // Enforce MAX_ENTRIES — delete oldest beyond the cap
  const all = await userHistoryRef(userId)
    .orderBy("createdAt", "asc")
    .get();
  if (all.size > MAX_ENTRIES) {
    const toDelete = all.docs.slice(0, all.size - MAX_ENTRIES);
    const batch = firestore().batch();
    toDelete.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

export async function deleteEntry(
  userId: string,
  entryId: string,
): Promise<void> {
  await userHistoryRef(userId).doc(entryId).delete();
}

export async function getEntryAudioUrl(
  userId: string,
  entryId: string,
): Promise<string | null> {
  const doc = await userHistoryRef(userId).doc(entryId).get();
  if (!doc.exists) return null;
  return (doc.data() as HistoryEntry).audioUrl ?? null;
}

export async function updateEntryAudioUrl(
  userId: string,
  entryId: string,
  audioUrl: string,
): Promise<void> {
  await userHistoryRef(userId).doc(entryId).update({ audioUrl });
}

export async function clearHistory(userId: string): Promise<void> {
  const snapshot = await userHistoryRef(userId).get();
  const batch = firestore().batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}
