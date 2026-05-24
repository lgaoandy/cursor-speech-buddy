import fs from "fs";
import { Router } from "express";
import multer from "multer";
import type { Request, Response } from "express";
import type { HistoryEntry } from "../types/speech";
import {
  getHistory,
  saveEntry,
  deleteEntry,
  clearHistory,
  getEntryAudioUrl,
  updateEntryAudioUrl,
} from "../lib/firestore";
import { uploadAudioToDrive, deleteAudioFromDrive, streamAudioFromDrive } from "../lib/drive";
import { requireTosAccepted } from "./auth";

const upload = multer({ dest: "uploads/" });
const router = Router();

type SessionUser = {
  googleId: string;
  name: string;
  email: string;
  avatarUrl: string;
  accessToken: string;
};

function requireAuth(req: Request, res: Response): SessionUser | null {
  const user = req.user as SessionUser | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return user;
}

function historyError(res: Response, err: unknown, route: string): void {
  console.error(`[${route}]`, err);
  res.status(503).json({
    error: "Cloud history unavailable. Check Firebase credentials in services/api/.env",
  });
}

// All history routes require both authentication and ToS acceptance.
// Router is mounted on /history in index.ts, so paths below are relative.
router.use(requireTosAccepted);

// GET /history — fetch all entries for the signed-in user
router.get("/", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  try {
    const entries = await getHistory(user.googleId);
    res.json(entries);
  } catch (err) {
    historyError(res, err, "/history GET");
  }
});

// POST /history — save a history entry (+ optional audio file)
router.post(
  "/",
  upload.single("audio"),
  async (req: Request, res: Response): Promise<void> => {
    const user = requireAuth(req, res);
    const audioFile = req.file;

    const cleanup = () => {
      if (audioFile?.path) fs.unlink(audioFile.path, () => undefined);
    };

    if (!user) {
      cleanup();
      return;
    }

    let entry: HistoryEntry;
    try {
      entry = JSON.parse(req.body.entry as string) as HistoryEntry;
    } catch {
      cleanup();
      res.status(400).json({ error: "entry must be valid JSON." });
      return;
    }

    // If audio was provided, upload to Drive and attach the URL to the entry
    if (audioFile) {
      try {
        const buffer = fs.readFileSync(audioFile.path);
        const audioUrl = await uploadAudioToDrive(
          user.accessToken,
          entry.id,
          buffer,
          audioFile.mimetype || "audio/webm",
        );
        entry = { ...entry, audioUrl };
      } catch (err) {
        console.error("[/history POST] Drive upload failed:", err);
        // Non-fatal — save entry without audio rather than failing the whole request
      } finally {
        cleanup();
      }
    }

    try {
      await saveEntry(user.googleId, entry);
      res.json(entry);
    } catch (err) {
      historyError(res, err, "/history POST");
    }
  },
);

// POST /history/:entryId/audio — upload audio to Drive and attach URL to entry
router.post(
  "/:entryId/audio",
  upload.single("audio"),
  async (req: Request, res: Response): Promise<void> => {
    const user = requireAuth(req, res);
    const audioFile = req.file;

    const cleanup = () => {
      if (audioFile?.path) fs.unlink(audioFile.path, () => undefined);
    };

    if (!user) {
      cleanup();
      return;
    }

    if (!audioFile) {
      res.status(400).json({ error: "Missing audio file." });
      return;
    }

    const { entryId } = req.params;

    try {
      const buffer = fs.readFileSync(audioFile.path);
      const audioUrl = await uploadAudioToDrive(
        user.accessToken,
        entryId,
        buffer,
        audioFile.mimetype || "audio/webm",
      );
      await updateEntryAudioUrl(user.googleId, entryId, audioUrl);
      res.json({ audioUrl });
    } catch (err) {
      console.error("[/history/:entryId/audio POST]", err);
      res.status(500).json({ error: "Audio upload failed." });
    } finally {
      cleanup();
    }
  },
);

// GET /history/:entryId/audio-url — returns the backend proxy URL if audio exists, else null
router.get("/:entryId/audio-url", async (req: Request, res: Response) => {
  const user = requireAuth(req, res);
  if (!user) return;
  try {
    const fileId = await getEntryAudioUrl(user.googleId, req.params.entryId);
    if (!fileId) {
      res.json({ url: null });
      return;
    }
    const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
    res.json({ url: `${baseUrl}/history/${req.params.entryId}/audio` });
  } catch (err) {
    console.error("[/history/:entryId/audio-url GET]", err);
    res.status(500).json({ error: "Failed to retrieve audio URL." });
  }
});

// GET /history/:entryId/audio — stream audio from Drive via backend proxy
router.get("/:entryId/audio", async (req: Request, res: Response) => {
  const user = requireAuth(req, res);
  if (!user) return;
  try {
    const fileId = await getEntryAudioUrl(user.googleId, req.params.entryId);
    if (!fileId) {
      res.status(404).json({ error: "No audio for this entry." });
      return;
    }
    await streamAudioFromDrive(user.accessToken, fileId, res);
  } catch (err) {
    console.error("[/history/:entryId/audio GET]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream audio." });
    }
  }
});

// DELETE /history/:entryId — delete a single entry
router.delete("/:entryId", async (req: Request, res: Response) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const { entryId } = req.params;

  try {
    const fileId = await getEntryAudioUrl(user.googleId, entryId);
    if (fileId) {
      await deleteAudioFromDrive(user.accessToken, fileId);
    }
    await deleteEntry(user.googleId, entryId);
    res.json({ ok: true });
  } catch (err) {
    historyError(res, err, "/history DELETE :entryId");
  }
});

// DELETE /history — clear all entries for the user
router.delete("/", async (req: Request, res: Response) => {
  const user = requireAuth(req, res);
  if (!user) return;
  try {
    await clearHistory(user.googleId);
    res.json({ ok: true });
  } catch (err) {
    historyError(res, err, "/history DELETE");
  }
});

export default router;
