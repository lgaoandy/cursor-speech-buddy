/**
 * Time / date formatting helpers shared across the UI. Centralising these
 * keeps "m:ss" vs "mm:ss" behaviour consistent and removes five near-identical
 * copies that had drifted across components.
 */

/** "m:ss" — minutes are not zero-padded. Used in feedback transcript markers. */
export function formatMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** "mm:ss" — both fields zero-padded. Used in the recorder timer + brief form. */
export function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** "Xm Ys" or "Ys" — readable duration label for history cards. */
export function formatDurationLabel(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/** Localised "Mmm d, yyyy, hh:mm" — history list timestamps. */
export function formatHistoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
