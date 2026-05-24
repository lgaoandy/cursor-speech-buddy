import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const router = Router();

// Only register the strategy when credentials are configured.
// Without this guard the server crashes at startup with empty .env values.
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
    // drive.file: create/manage files this app creates (supports public sharing)
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

// GET /auth/me — return current session user (or 401)
router.get("/auth/me", (req, res) => {
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
  res.json({ googleId, name, email, avatarUrl });
});

// POST /auth/logout — destroy session
router.post("/auth/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });
});

export default router;
