import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Lazily initialise the Firebase Admin SDK on first use. Safe to call from
 * multiple modules — `getApps()` ensures we never double-initialise.
 */
function ensureFirebaseApp(): void {
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

/** Returns the Firestore client, initialising Firebase Admin if needed. */
export function firestore(): Firestore {
  ensureFirebaseApp();
  return getFirestore();
}
