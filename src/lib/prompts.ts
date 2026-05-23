import type { SpeechBrief } from "@/types/speech";

/**
 * System prompt for the analysis LLM (used by the backend API).
 * Kept in the frontend repo so rubric changes stay in sync with the UI.
 */
export function buildAnalysisSystemPrompt(): string {
  return `You are an expert speech coach trained in Toastmasters evaluation standards.
Analyze practice speeches constructively. Be specific, cite short quotes from the transcript, and score each category 1-5 (1=needs work, 5=excellent).
Return valid JSON only, matching the schema provided in the user message.`;
}

export function buildAnalysisUserPrompt(
  brief: SpeechBrief,
  transcript: string,
  durationSeconds: number,
  fillerCount: number,
): string {
  const limitSeconds = brief.timeLimitMinutes * 60;
  return JSON.stringify({
    brief: {
      format: brief.format,
      title: brief.title,
      description: brief.description,
      takeaways: brief.takeaways,
      timeLimitMinutes: brief.timeLimitMinutes,
      watchFor: brief.watchFor,
    },
    metrics: {
      durationSeconds,
      limitSeconds,
      fillerCount,
    },
    transcript,
    instructions: [
      "Evaluate content, delivery, and language using Toastmasters criteria.",
      "Assess whether each of the three audience takeaways was clearly supported.",
      "Comment on timing vs the limit and filler word usage.",
      "Prioritize feedback for criteria listed in brief.watchFor.",
    ],
  });
}
