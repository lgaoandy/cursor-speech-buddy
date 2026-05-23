import { GoogleGenAI } from "@google/genai";
import type { SpeechBrief, CategoryFeedback, TakeawayAlignment } from "../types/speech";
import { buildAnalysisSystemPrompt, buildAnalysisUserPrompt } from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

interface LLMResult {
  content: CategoryFeedback;
  delivery: CategoryFeedback;
  language: CategoryFeedback;
  takeawayAlignment: TakeawayAlignment[];
  overallSummary: string;
}

/**
 * Calls Gemini 2.5 Flash with the speech brief + transcript and returns
 * the structured feedback fields. Timing and fillers are computed in code
 * (not by the LLM) and merged in the route handler.
 */
export async function evaluateSpeech(
  brief: SpeechBrief,
  transcript: string,
  durationSeconds: number,
  fillerCount: number,
): Promise<LLMResult> {
  const prompt =
    buildAnalysisSystemPrompt() +
    "\n\n" +
    buildAnalysisUserPrompt(brief, transcript, durationSeconds, fillerCount);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: { responseMimeType: "application/json" },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const raw = response.text;
  if (!raw) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed: LLMResult;
  try {
    parsed = JSON.parse(raw) as LLMResult;
  } catch {
    // Retry once — Gemini occasionally wraps JSON in markdown fences
    const stripped = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    try {
      parsed = JSON.parse(stripped) as LLMResult;
    } catch {
      throw new Error(`Failed to parse Gemini response as JSON: ${raw.slice(0, 200)}`);
    }
  }

  return parsed;
}
