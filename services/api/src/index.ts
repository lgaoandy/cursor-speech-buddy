import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import analyzeRouter from "./routes/analyze";
import authRouter from "./routes/auth";
import historyRouter from "./routes/history";
import tosRouter from "./routes/tos";

const PORT = process.env.PORT ?? "3001";
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

const app = express();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // required for session cookies cross-origin
  }),
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(analyzeRouter);
app.use(authRouter);
app.use(historyRouter);
app.use(tosRouter);

app.listen(Number(PORT), () => {
  console.log(`API running on http://localhost:${PORT}`);
});
