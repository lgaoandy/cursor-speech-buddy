import type { SpeechBrief, SpeechFeedback } from "@/types/speech";
import { EVALUATION_CATEGORIES } from "@/lib/toastmasters";
import { formatMSS } from "@/lib/format";
import { segmentTranscript } from "@/lib/transcript";
import { ScoreRing } from "@/components/ScoreRing";

interface FeedbackReportProps {
  brief: SpeechBrief;
  feedback: SpeechFeedback;
  savedEntryId: string | null;
  onStartOver: () => void;
  onPracticeAgain: () => void;
}

/** Convert a 1–10 LLM score to a displayed 1–5 score (1 decimal). */
function toFive(raw: number): number {
  return Math.round((raw / 2) * 10) / 10;
}

/** Card chrome (border + background) for a category, keyed off its 0–5 score. */
function categoryCardClass(score: number): string {
  if (score >= 4) return "border-green-400 bg-green-50";
  if (score >= 3) return "border-amber-400 bg-amber-50";
  return "border-red-400 bg-red-50";
}

const BLANK_VALUES = new Set(["n/a", "na", "none", "no", "-", "–", ""]);

function isBlank(s: string) {
  return BLANK_VALUES.has(s.trim().toLowerCase());
}

function CategoryCard({
  title,
  hint,
  data,
}: {
  title: string;
  hint: string;
  data: SpeechFeedback["content"];
}) {
  const displayScore = toFive(data.score);
  const strengths = data.strengths.filter((s) => !isBlank(s));
  const improvements = data.improvements.filter((s) => !isBlank(s));

  return (
    <article
      className={`rounded-xl border-2 p-4 ${categoryCardClass(displayScore)}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-[var(--muted)]">{hint}</p>
        </div>
        <ScoreRing score={displayScore} showMax />
      </div>

      <p className="mb-3 text-sm leading-relaxed">{data.summary}</p>

      {strengths.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">
            Strengths
          </p>
          <ul className="flex flex-col gap-1">
            {strengths.map((s) => (
              <li key={s} className="flex gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-green-600">✓</span>
                <span className="text-green-900">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600">
            Areas to improve
          </p>
          <ul className="flex flex-col gap-1">
            {improvements.map((s) => (
              <li key={s} className="flex gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-red-500">↑</span>
                <span className="text-red-800">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------

/** Split overallSummary into bullet points if it contains sentence breaks. */
function parseSummaryBullets(text: string): string[] {
  // Already formatted with bullet markers
  if (/^[-•*]\s/m.test(text)) {
    return text
      .split(/\n/)
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }
  // Split on sentence boundaries into bullets (3+ sentences → list)
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.length >= 3 ? sentences : [text];
}

export function FeedbackReport({
  brief,
  feedback,
  savedEntryId,
  onStartOver,
  onPracticeAgain,
}: FeedbackReportProps) {
  const categoryMap = {
    content: feedback.content,
    delivery: feedback.delivery,
    language: feedback.language,
  };

  const summaryBullets = parseSummaryBullets(feedback.overallSummary);
  const transcriptSegments = segmentTranscript(
    feedback.transcript,
    feedback.timing.durationSeconds,
  );

  const displayScores = [
    toFive(feedback.content.score),
    toFive(feedback.delivery.score),
    toFive(feedback.language.score),
  ];
  const sum = displayScores.reduce((a, b) => a + b, 0);
  const avgScore = Math.round((sum / 15) * 10 * 10) / 10;
  const avgStroke = avgScore >= 8 ? "#16a34a" : avgScore >= 6 ? "#d97706" : "#dc2626";
  const avgLabel = avgScore >= 8 ? "Strong" : avgScore >= 6 ? "Developing" : "Needs work";

  return (
    <div className="flex flex-col gap-6">

      {/* Overall summary */}
      <section className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-muted)] p-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="font-semibold text-[var(--accent)]">Overall</h2>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold leading-none" style={{ color: avgStroke }}>
                {avgScore}<span className="text-base font-normal text-[var(--muted)]">/10</span>
              </p>
              <p className="text-xs font-medium" style={{ color: avgStroke }}>{avgLabel}</p>
            </div>
            <div className="h-10 w-px bg-[var(--accent-muted)] opacity-50" />
            <div className="flex gap-2 text-xs text-[var(--muted)]">
              {[
                { label: "Content", score: displayScores[0] },
                { label: "Delivery", score: displayScores[1] },
                { label: "Language", score: displayScores[2] },
              ].map(({ label, score }) => {
                const c = score >= 4 ? "#16a34a" : score >= 3 ? "#d97706" : "#dc2626";
                return (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <span className="font-semibold" style={{ color: c }}>{score}/5</span>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {summaryBullets.length === 1 ? (
          <p className="text-sm leading-relaxed">{summaryBullets[0]}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {summaryBullets.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="mt-0.5 shrink-0 font-bold text-[var(--accent)]">·</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Timing + Fillers */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-xl border-2 p-4 ${
            feedback.timing.durationSeconds < feedback.timing.minSeconds
              ? "border-amber-400 bg-amber-50"
              : feedback.timing.withinRange
                ? "border-green-400 bg-green-50"
                : "border-red-400 bg-red-50"
          }`}
        >
          <h3 className="text-sm font-medium text-[var(--muted)]">Timing</h3>
          <p className="text-2xl font-bold">
            {formatMSS(feedback.timing.durationSeconds)}
          </p>
          <p className="text-xs text-[var(--muted)]">
            target {formatMSS(feedback.timing.minSeconds)} – {formatMSS(feedback.timing.maxSeconds)}
          </p>
          <p
            className={`mt-1 text-sm font-semibold ${
              feedback.timing.durationSeconds < feedback.timing.minSeconds
                ? "text-amber-700"
                : feedback.timing.withinRange
                  ? "text-green-700"
                  : "text-red-700"
            }`}
          >
            {feedback.timing.durationSeconds < feedback.timing.minSeconds
              ? "Below minimum — speech was too short"
              : feedback.timing.withinRange
                ? "Within target range"
                : `Over maximum by ${feedback.timing.durationSeconds - feedback.timing.maxSeconds}s`}
          </p>
        </div>

        <div
          className={`rounded-xl border-2 p-4 ${
            feedback.fillers.count === 0
              ? "border-green-400 bg-green-50"
              : feedback.fillers.count <= 5
                ? "border-amber-400 bg-amber-50"
                : "border-red-400 bg-red-50"
          }`}
        >
          <h3 className="text-sm font-medium text-[var(--muted)]">Filler words</h3>
          <p className="text-2xl font-bold">
            {feedback.fillers.count}
            <span className="text-base font-normal text-[var(--muted)]"> total</span>
          </p>
          {Object.keys(feedback.fillers.breakdown).length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {Object.entries(feedback.fillers.breakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([word, n]) => (
                  <li
                    key={word}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-2.5 py-1"
                  >
                    <span className="text-xs font-medium">"{word}"</span>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                      {n}
                    </span>
                  </li>
                ))}
            </ul>
          )}
          {feedback.fillers.count === 0 && (
            <p className="mt-1 text-sm font-semibold text-green-700">
              No filler words detected
            </p>
          )}
        </div>
      </section>

      {/* Category cards */}
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Toastmasters categories</h2>
        {EVALUATION_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.key}
            title={cat.title}
            hint={cat.hint}
            data={categoryMap[cat.key]}
          />
        ))}
      </section>

      {/* Audience takeaways */}
      <section className="rounded-xl border-2 border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 font-semibold">Audience takeaways</h2>
        <ul className="flex flex-col gap-3">
          {feedback.takeawayAlignment
            .filter((_, i) => brief.takeaways[i]?.trim().length > 0)
            .map((item, i) => (
              <li
                key={i}
                className={`flex gap-3 rounded-lg border-2 p-3 text-sm ${
                  item.addressed
                    ? "border-green-300 bg-green-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <span
                  className={`mt-0.5 shrink-0 text-lg font-bold ${
                    item.addressed ? "text-green-600" : "text-amber-500"
                  }`}
                  aria-hidden
                >
                  {item.addressed ? "✓" : "○"}
                </span>
                <div>
                  <p className="font-semibold">
                    {item.takeaway || brief.takeaways[i]}
                  </p>
                  <p className="text-[var(--muted)]">{item.notes}</p>
                </div>
              </li>
            ))}
        </ul>
      </section>

      {/* Transcript */}
      <details className="rounded-xl border-2 border-[var(--border)] bg-[var(--card)] p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Transcript
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          {transcriptSegments.map((seg, i) => (
            <div key={i} className="flex gap-3">
              {/* Timestamp gutter */}
              <div className="flex flex-col items-center gap-1">
                <span className="shrink-0 rounded-full bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                  {formatMSS(seg.startSeconds)}
                </span>
                {i < transcriptSegments.length - 1 && (
                  <div className="w-px flex-1 bg-[var(--border)]" />
                )}
              </div>
              {/* Segment text */}
              <p className="pb-2 text-sm leading-relaxed text-[var(--muted)]">
                {seg.text}
              </p>
            </div>
          ))}
        </div>
      </details>

      {savedEntryId && (
        <p className="flex items-center gap-1.5 text-xs text-green-700">
          <span aria-hidden>✓</span> Saved to history
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white"
        >
          Practice again
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="rounded-lg border-2 border-[var(--border)] px-4 py-3 text-sm font-medium"
        >
          New speech brief
        </button>
      </div>
    </div>
  );
}
