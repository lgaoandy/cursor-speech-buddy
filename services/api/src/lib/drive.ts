import { google, type drive_v3 } from "googleapis";
import { Readable } from "stream";

function driveClient(accessToken: string): drive_v3.Drive {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

/**
 * Uploads an audio buffer to the user's Google Drive.
 * Returns the Drive file ID. Audio is served via the backend proxy
 * (/history/:id/audio) using the user's session token — no public sharing needed.
 */
export async function uploadAudioToDrive(
  accessToken: string,
  entryId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const response = await driveClient(accessToken).files.create({
    requestBody: {
      name: `speech-buddy-${entryId}.webm`,
      mimeType,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id",
  });

  const fileId = response.data.id;
  if (!fileId) throw new Error("Drive upload returned no file ID.");

  return fileId;
}

/**
 * Streams a Drive file to the Express response using the user's access token.
 */
export async function streamAudioFromDrive(
  accessToken: string,
  fileId: string,
  res: import("express").Response,
): Promise<void> {
  const driveRes = await driveClient(accessToken).files.get(
    { fileId, alt: "media" },
    { responseType: "stream" },
  );

  const contentType =
    (driveRes.headers as Record<string, string>)["content-type"] ?? "audio/webm";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "private, max-age=3600");
  (driveRes.data as import("stream").Readable).pipe(res);
}

export async function deleteAudioFromDrive(
  accessToken: string,
  fileId: string,
): Promise<void> {
  await driveClient(accessToken).files.delete({ fileId }).catch(() => {
    // File may already be deleted — ignore
  });
}
