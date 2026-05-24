import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getUserTosStatus, hasTosAccepted, CURRENT_TOS_VERSION } from "../lib/tos";

const router = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: `${process.env.API_BASE_URL ?? "http://localhost:3001"}/auth/google/callback`,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const user = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value ?? "",
          avatarUrl: profile.photos?.[0]?.value ?? "",
          accessToken: _accessToken,
        };
        done(null, user);
      },
    ),
  );
} else {
  console.warn("[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google OAuth disabled.");
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user as Express.User));

// GET /auth/google — redirect to Google consent screen
router.get("/auth/google", (req, res, next) => {
  if (!googleClientId || !googleClientSecret) {
    res.status(503).json({
      error: "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env",
    });
    return;
  }
  passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/drive.file"],
    accessType: "offline",
    prompt: "consent",
  })(req, res, next);
});

// GET /auth/google/callback — called by Google after consent
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const frontendUrl = process.env.ALLOWED_ORIGINS?.split(",")[0] ?? "http://localhost:5173";
    res.redirect(`${frontendUrl.trim()}?auth=success`);
  },
);

// GET /auth/me — return current session user plus live ToS status
router.get("/auth/me", async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { googleId, name, email, avatarUrl } = req.user as {
    googleId: string;
    name: string;
    email: string;
    avatarUrl: string;
    accessToken: string;
  };

  try {
    const tosStatus = await getUserTosStatus(googleId);
    res.json({ googleId, name, email, avatarUrl, tosStatus });
  } catch (err) {
    console.error("[GET /auth/me] Failed to fetch ToS status:", err);
    // Return user without ToS status rather than failing the whole auth check;
    // the frontend will treat a missing tosStatus as not accepted.
    res.json({ googleId, name, email, avatarUrl, tosStatus: { accepted: false, version: null } });
  }
});

// POST /auth/logout — destroy session
router.post("/auth/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });
});

/**
 * Middleware that blocks authenticated users who have not accepted the current ToS.
 * Apply to any route that stores or returns user-associated data.
 * Guests are not affected (they have no session and are checked client-side only).
 */
export async function requireTosAccepted(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = req.user as { googleId: string } | undefined;
  if (!user) {
    // No session — let requireAuth handle the 401 downstream
    next();
    return;
  }

  try {
    const accepted = await hasTosAccepted(user.googleId);
    if (!accepted) {
      res.status(403).json({
        error: "ToS acceptance required",
        code: "TOS_NOT_ACCEPTED",
        requiredVersion: CURRENT_TOS_VERSION,
      });
      return;
    }
  } catch (err) {
    console.error("[requireTosAccepted]", err);
    res.status(500).json({ error: "Could not verify Terms of Service acceptance." });
    return;
  }

  next();
}

export default router;
