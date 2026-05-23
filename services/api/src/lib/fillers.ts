export const FILLER_PATTERNS =
  /\b(um+|uh+|ah+|er+|like|you know|sort of|kind of)\b/gi;

export function countFillers(transcript: string): {
  count: number;
  examples: string[];
} {
  const matches = transcript.match(FILLER_PATTERNS) ?? [];
  const examples = [...new Set(matches.map((m) => m.toLowerCase()))].slice(0, 8);
  return { count: matches.length, examples };
}
