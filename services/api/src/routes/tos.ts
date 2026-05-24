import { Router } from "express";
import type { Request, Response } from "express";
import {
  CURRENT_TOS_VERSION,
  getTosContent,
  recordTosAcceptance,
} from "../lib/tos";

const router = Router();

type SessionUser = {
  googleId: string;
};

// GET /tos — public, no auth required.
// Returns the current ToS markdown content and version number.
// Guests and authenticated users both fetch from here.
router.get("/tos", (_req: Request, res: Response) => {
  try {
    const content = getTosContent();
    res.json({ version: CURRENT_TOS_VERSION, content });
  } catch (err) {
    console.error("[GET /tos] Failed to read ToS file:", err);
    res.status(500).json({ error: "Terms of Service unavailable." });
  }
});

// POST /tos/accept — authenticated users only.
// Records acceptance with timestamp and IP address for legal audit trail.
router.post("/tos/accept", async (req: Request, res: Response) => {
  const user = req.user as SessionUser | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  // Prefer X-Forwarded-For when behind a proxy/load balancer
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  try {
    await recordTosAcceptance(user.googleId, ip);
    res.json({ ok: true, version: CURRENT_TOS_VERSION });
  } catch (err) {
    console.error("[POST /tos/accept]", err);
    res.status(500).json({ error: "Failed to record ToS acceptance." });
  }
});

export default router;
