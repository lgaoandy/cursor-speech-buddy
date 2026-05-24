import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { HistoryEntry } from "../types/speech";

const MAX_ENTRIES = 20;

function initFirebase() {
  if (getApps().length > 0) return;
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Newlines in env vars are escaped — restore them
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

function db() {
  initFirebase();
  return getFirestore();
}

function userHistoryRef(userId: string) {
  return db().collection("users").doc(userId).collection("history");
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
    const batch = db().batch();
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
  const batch = db().batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}
