import type { SpeechBrief } from "../types/speech";

export function buildAnalysisSystemPrompt(): string {
  return `You are a demanding but fair Toastmasters speech coach with high standards.

Scoring guide (be honest — most practice speeches score 2–3):
  5 = Exceptional. Rare. Reserve for truly polished, near-flawless delivery.
  4 = Strong. Clear structure, confident delivery, minor issues only.
  3 = Developing. Some good moments but noticeable gaps in content or delivery.
  2 = Needs work. Significant issues with structure, clarity, or engagement.
  1 = Major revision required. Unclear, disorganised, or very difficult to follow.

Rules:
- Be specific. Quote short phrases from the transcript to back up your points.
- Do NOT give empty praise. If content or delivery is weak, say so clearly.
- improvements[] must contain real, actionable suggestions — NEVER "N/a", "None", or empty strings.
  If there are no improvements, return an empty array [].
- strengths[] must also be genuine. If there are none, return [].
- overallSummary must be concise: 2–4 sentences or a short bullet list. No padding.
- Be especially critical of content (structure, argument, relevance) and delivery (pace, energy, clarity).
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
      content: { score: "number 1-5", summary: "string", strengths: "string[]", improvements: "string[]" },
      delivery: { score: "number 1-5", summary: "string", strengths: "string[]", improvements: "string[]" },
      language: { score: "number 1-5", summary: "string", strengths: "string[]", improvements: "string[]" },
      takeawayAlignment: [{ takeaway: "string", addressed: "boolean", notes: "string" }],
      overallSummary: "string",
    },
  });
}
