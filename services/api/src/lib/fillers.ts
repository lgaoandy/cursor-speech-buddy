export const FILLER_PATTERNS =
  /\b(um+|uh+|ah+|er+|erm+|like|you know|sort of|kind of|basically|literally|actually|right\?|yeah)\b/gi;

export function countFillers(transcript: string): {
  count: number;
  breakdown: Record<string, number>;
} {
  const matches = transcript.match(FILLER_PATTERNS) ?? [];
  const breakdown: Record<string, number> = {};
  for (const match of matches) {
    const word = match.toLowerCase();
    breakdown[word] = (breakdown[word] ?? 0) + 1;
  }
  return { count: matches.length, breakdown };
}
