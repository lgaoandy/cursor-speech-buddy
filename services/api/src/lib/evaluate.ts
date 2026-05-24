import Groq from "groq-sdk";
import type { SpeechBrief, CategoryFeedback, TakeawayAlignment } from "../types/speech";
import { buildAnalysisSystemPrompt, buildAnalysisUserPrompt } from "./prompts";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface LLMResult {
  content: CategoryFeedback;
  delivery: CategoryFeedback;
  language: CategoryFeedback;
  takeawayAlignment: TakeawayAlignment[];
  overallSummary: string;
}

/**
 * Calls Groq Llama 3.3 70B with the speech brief + transcript and returns
 * the structured feedback fields. Timing and fillers are computed in code
 * (not by the LLM) and merged in the route handler.
 */
export async function evaluateSpeech(
  brief: SpeechBrief,
  transcript: string,
  durationSeconds: number,
  fillerCount: number,
): Promise<LLMResult> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildAnalysisSystemPrompt() },
      { role: "user", content: buildAnalysisUserPrompt(brief, transcript, durationSeconds, fillerCount) },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Groq returned an empty response.");
  }

  let parsed: LLMResult;
  try {
    parsed = JSON.parse(raw) as LLMResult;
  } catch {
    // Strip markdown fences if the model wrapped the JSON
    const stripped = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    try {
      parsed = JSON.parse(stripped) as LLMResult;
    } catch {
      throw new Error(`Failed to parse Groq response as JSON: ${raw.slice(0, 200)}`);
    }
  }

  return parsed;
}
