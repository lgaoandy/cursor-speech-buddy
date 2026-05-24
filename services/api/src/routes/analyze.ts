import fs from "fs";
import { Router } from "express";
import multer from "multer";
import type { Request, Response } from "express";
import type { SpeechBrief, SpeechFeedback } from "../types/speech";
import { transcribeAudio } from "../lib/transcribe";
import { evaluateSpeech } from "../lib/evaluate";
import { countFillers } from "../lib/fillers";

const FIFTY_MB = 50 * 1024 * 1024;
const upload = multer({ dest: "uploads/", limits: { fileSize: FIFTY_MB } });
const router = Router();

router.post(
  "/analyze",
  upload.single("audio"),
  async (req: Request, res: Response): Promise<void> => {
    const file = req.file;

    // Always clean up the temp file when we're done, success or failure
    const cleanup = () => {
      if (file?.path) {
        fs.unlink(file.path, () => undefined);
      }
    };

    if (!file) {
      res.status(400).json({ error: "Missing audio file." });
      return;
    }

    const rawBrief = req.body.brief as string | undefined;
    const rawDuration = req.body.durationSeconds as string | undefined;

    if (!rawBrief || !rawDuration) {
      cleanup();
      res.status(400).json({ error: "Missing brief or durationSeconds." });
      return;
    }

    let brief: SpeechBrief;
    try {
      brief = JSON.parse(rawBrief) as SpeechBrief;
    } catch {
      cleanup();
      res.status(400).json({ error: "brief must be valid JSON." });
      return;
    }

    const durationSeconds = Number(rawDuration);
    if (isNaN(durationSeconds) || durationSeconds <= 0) {
      cleanup();
      res.status(400).json({ error: "durationSeconds must be a positive number." });
      return;
    }

    try {
      const transcript = await transcribeAudio(file.path, file.originalname);

      const fillers = countFillers(transcript);

      const limitSeconds = brief.timeLimitMinutes * 60;
      const timing = {
        durationSeconds,
        limitSeconds,
        withinLimit: durationSeconds <= limitSeconds,
        percentOfLimit: Math.round((durationSeconds / limitSeconds) * 100),
      };

      const llmResult = await evaluateSpeech(
        brief,
        transcript,
        durationSeconds,
        fillers.count,
      );

      const feedback: SpeechFeedback = {
        transcript,
        timing,
        fillers,
        ...llmResult,
      };

      cleanup();
      res.json(feedback);
    } catch (err) {
      cleanup();
      const message = err instanceof Error ? err.message : "Unexpected server error.";
      console.error("[/analyze]", message);
      res.status(500).json({ error: message });
    }
  },
);

export default router;
