import "dotenv/config";
import express from "express";
import cors from "cors";
import analyzeRouter from "./routes/analyze";

const PORT = process.env.PORT ?? "3001";
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

const app = express();

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(analyzeRouter);

app.listen(Number(PORT), () => {
  console.log(`API running on http://localhost:${PORT}`);
});
