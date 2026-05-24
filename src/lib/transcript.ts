export interface TranscriptSegment {
  startSeconds: number;
  text: string;
}

/**
 * Divides a plain-text transcript into roughly one-minute segments without
 * cutting mid-sentence. Start times are estimated proportionally by word
 * count, since Whisper's plain-text mode does not return word-level timings.
 *
 * Extracted from FeedbackReport so it can be unit-tested in isolation.
 */
export function segmentTranscript(
  transcript: string,
  durationSeconds: number,
): TranscriptSegment[] {
  // Split on sentence-ending punctuation followed by whitespace or end of string
  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return [];

  // Word count per sentence; estimate start time of each sentence
  const wordCounts = sentences.map((s) => s.split(/\s+/).length);
  const totalWords = wordCounts.reduce((a, b) => a + b, 0);

  const sentenceStartTimes: number[] = [];
  let cumulative = 0;
  for (const count of wordCounts) {
    sentenceStartTimes.push(
      totalWords > 0 ? (cumulative / totalWords) * durationSeconds : 0,
    );
    cumulative += count;
  }

  // Build one segment per minute mark (0, 60, 120 …). Each mark snaps to the
  // first sentence at or after that mark, so segments never split a sentence.
  const minuteMarks: number[] = [0];
  for (let m = 60; m < durationSeconds; m += 60) minuteMarks.push(m);

  const boundaries: number[] = [];
  for (const mark of minuteMarks) {
    if (mark === 0) {
      boundaries.push(0);
      continue;
    }
    const idx = sentenceStartTimes.findIndex((t) => t >= mark);
    const resolved = idx === -1 ? sentences.length - 1 : idx;
    // Skip if identical to previous boundary (e.g. short speeches)
    if (resolved !== boundaries[boundaries.length - 1]) {
      boundaries.push(resolved);
    }
  }

  return boundaries.map((startIdx, bi) => {
    const endIdx =
      bi + 1 < boundaries.length ? boundaries[bi + 1] : sentences.length;
    return {
      startSeconds: Math.round(sentenceStartTimes[startIdx]),
      text: sentences.slice(startIdx, endIdx).join(" "),
    };
  });
}
