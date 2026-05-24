import fs from "fs";
import path from "path";
import { firestore } from "./firebase";

export const CURRENT_TOS_VERSION = "1.0";

// Resolved relative to process.cwd() so it survives changes to the compiled
// output layout. The API is always started from services/api/ (both `npm run
// dev` and `npm start`), so the repo's docs/ folder is two levels up.
// Override with TOS_FILE_PATH (absolute or cwd-relative) in non-standard deploys.
const TOS_FILE_PATH = path.resolve(
  process.cwd(),
  process.env.TOS_FILE_PATH ?? "../../docs/SpeechBuddy_TermsOfService.md",
);

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

function userDocRef(userId: string) {
  return firestore().collection("users").doc(userId);
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
