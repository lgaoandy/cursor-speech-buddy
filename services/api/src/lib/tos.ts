import fs from "fs";
import path from "path";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

export const CURRENT_TOS_VERSION = "1.0";

// Path resolved from compiled output (dist/lib/) up to project root, then into docs/
const TOS_FILE_PATH = path.resolve(__dirname, "../../../../docs/SpeechBuddy_TermsOfService.md");

export interface TosRecord {
  tosAccepted: boolean;
  tosAcceptedAt: string;
  tosVersion: string;
  tosAcceptedIp: string;
}

export interface TosStatus {
  accepted: boolean;
  version: string | null;
}

function initFirebase() {
  if (getApps().length > 0) return;
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

function db() {
  initFirebase();
  return getFirestore();
}

function userDocRef(userId: string) {
  return db().collection("users").doc(userId);
}

export function getTosContent(): string {
  return fs.readFileSync(TOS_FILE_PATH, "utf-8");
}

export async function getUserTosStatus(userId: string): Promise<TosStatus> {
  const doc = await userDocRef(userId).get();
  if (!doc.exists) return { accepted: false, version: null };
  const data = doc.data() as Partial<TosRecord>;
  return {
    accepted: data.tosAccepted === true && data.tosVersion === CURRENT_TOS_VERSION,
    version: data.tosVersion ?? null,
  };
}

export async function recordTosAcceptance(
  userId: string,
  ip: string,
): Promise<void> {
  await userDocRef(userId).set(
    {
      tosAccepted: true,
      tosAcceptedAt: new Date().toISOString(),
      tosVersion: CURRENT_TOS_VERSION,
      tosAcceptedIp: ip,
    },
    { merge: true },
  );
}

/** Returns true if the user has accepted the current ToS version. */
export async function hasTosAccepted(userId: string): Promise<boolean> {
  const status = await getUserTosStatus(userId);
  return status.accepted;
}
