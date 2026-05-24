import type { SpeechBrief, SpeechFeedback } from "@/types/speech";
import { FILLER_PATTERNS } from "@/lib/toastmasters";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export function countFillers(transcript: string): {
  count: number;
  examples: string[];
} {
  const matches = transcript.match(FILLER_PATTERNS) ?? [];
  const examples = [...new Set(matches.map((m) => m.toLowerCase()))].slice(
    0,
    8,
  );
  return { count: matches.length, examples };
}

/** Mock feedback for local dev when no API is running */
export function mockFeedback(
  brief: SpeechBrief,
  durationSeconds: number,
): SpeechFeedback {
  const minSeconds = brief.minSeconds;
  const maxSeconds = brief.maxSeconds;
  const transcript =
    "[Demo mode] Connect VITE_API_URL to your backend for real transcription and AI feedback.";
  const fillers = countFillers(
    "um so today uh I want to talk about like you know our three goals",
  );

  return {
    transcript,
    timing: {
      durationSeconds,
      minSeconds,
      maxSeconds,
      withinRange: durationSeconds >= minSeconds && durationSeconds <= maxSeconds,
      percentOfMax: Math.round((durationSeconds / maxSeconds) * 100),
    },
    fillers,
    content: {
      score: 3,
      summary: "Placeholder — wire up the analyze API.",
      strengths: ["Clear brief captured"],
      improvements: ["Add a real practice recording"],
    },
    delivery: {
      score: 3,
      summary: "Delivery analysis pending API.",
      strengths: [],
      improvements: ["Record a full practice run"],
    },
    language: {
      score: 3,
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
    const message = await res.text();
    throw new Error(message || `Analysis failed (${res.status})`);
  }

  return res.json() as Promise<SpeechFeedback>;
}
