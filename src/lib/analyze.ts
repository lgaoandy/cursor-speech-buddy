import type { SpeechBrief, SpeechFeedback } from "@/types/speech";

const API_URL = import.meta.env.VITE_API_URL ?? "";

// Fixed sample so demo mode (no backend) shows a realistic-looking filler card
// without dragging the real regex into the bundle.
const DEMO_FILLERS = {
  count: 8,
  breakdown: { um: 2, uh: 1, like: 2, "you know": 1, "sort of": 1, basically: 1 },
};

/** Mock feedback for local dev when no API is running */
function mockFeedback(
  brief: SpeechBrief,
  durationSeconds: number,
): SpeechFeedback {
  const minSeconds = brief.minSeconds;
  const maxSeconds = brief.maxSeconds;
  const transcript =
    "[Demo mode] Connect VITE_API_URL to your backend for real transcription and AI feedback.";

  return {
    transcript,
    timing: {
      durationSeconds,
      minSeconds,
      maxSeconds,
      withinRange: durationSeconds >= minSeconds && durationSeconds <= maxSeconds,
      percentOfMax: Math.round((durationSeconds / maxSeconds) * 100),
    },
    fillers: DEMO_FILLERS,
    content: {
      score: 6,
      summary: "Placeholder — wire up the analyze API.",
      strengths: ["Clear brief captured"],
      improvements: ["Add a real practice recording"],
    },
    delivery: {
      score: 6,
      summary: "Delivery analysis pending API.",
      strengths: [],
      improvements: ["Record a full practice run"],
    },
    language: {
      score: 6,
      summary: "Language analysis pending API.",
      strengths: [],
      improvements: [],
    },
    takeawayAlignment: brief.takeaways.map((takeaway) => ({
      takeaway: takeaway || "(empty)",
      addressed: false,
      notes: "Will evaluate once transcript is available.",
    })),
    overallSummary:
      "Demo feedback only. Set VITE_API_URL and implement POST /analyze on your backend.",
  };
}

export async function analyzeSpeech(
  brief: SpeechBrief,
  audio: Blob,
  durationSeconds: number,
): Promise<SpeechFeedback> {
  if (!API_URL) {
    return mockFeedback(brief, durationSeconds);
  }

  const form = new FormData();
  form.append("audio", audio, "practice.webm");
  form.append("brief", JSON.stringify(brief));
  form.append("durationSeconds", String(durationSeconds));

  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    let message = `Analysis failed (${res.status})`;
    try {
      const parsed = JSON.parse(body) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      if (body.trim()) message = body.trim();
    }
    throw new Error(message);
  }

  return res.json() as Promise<SpeechFeedback>;
}
