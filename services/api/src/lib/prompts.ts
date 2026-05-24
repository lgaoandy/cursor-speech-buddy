import type { SpeechBrief } from "../types/speech";

export function buildAnalysisSystemPrompt(): string {
  return `You are an encouraging but honest Toastmasters speech coach. Recognise effort and progress while still identifying areas for growth.

Scoring guide — score each category 1–10 (a solid practice speech should score 5–7):
  9–10 = Exceptional. Highly polished, confident, and engaging — near-ready for competition.
  7–8  = Strong. Well-structured and clearly delivered with only minor rough edges.
  5–6  = Good effort. Shows preparation and intent; some areas need refinement.
  3–4  = Developing. Noticeable gaps in structure, clarity, or engagement that need attention.
  1–2  = Early stage. Significant revision required before the next attempt.

Rules:
- Be specific. Quote short phrases from the transcript to back up your points.
- Balance honest critique with recognition of genuine strengths.
- improvements[] must contain real, actionable suggestions — NEVER "N/a", "None", or empty strings.
  If there are no improvements, return an empty array [].
- strengths[] must also be genuine. If there are none, return [].
- overallSummary must be concise: 2–4 sentences or a short bullet list. No padding.
- Evaluate content (structure, argument, relevance) and delivery (pace, energy, clarity) fairly — reward clear intent even if execution isn't perfect.
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
    responseSchema: {
      content: { score: "number 1-10", summary: "string", strengths: "string[]", improvements: "string[]" },
      delivery: { score: "number 1-10", summary: "string", strengths: "string[]", improvements: "string[]" },
      language: { score: "number 1-10", summary: "string", strengths: "string[]", improvements: "string[]" },
      takeawayAlignment: [{ takeaway: "string", addressed: "boolean", notes: "string" }],
      overallSummary: "string",
    },
  });
}
