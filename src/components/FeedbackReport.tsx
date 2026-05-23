import type { SpeechBrief, SpeechFeedback } from "@/types/speech";
import { EVALUATION_CATEGORIES } from "@/lib/toastmasters";

interface FeedbackReportProps {
  brief: SpeechBrief;
  feedback: SpeechFeedback;
  onStartOver: () => void;
  onPracticeAgain: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 4
      ? "bg-green-100 text-green-800"
      : score >= 3
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {score}/5
    </span>
  );
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
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-[var(--muted)]">{hint}</p>
        </div>
        <ScoreBadge score={data.score} />
      </div>
      <p className="mb-3 text-sm">{data.summary}</p>
      {data.strengths.length > 0 && (
        <ul className="mb-2 list-inside list-disc text-sm text-green-800">
          {data.strengths.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      {data.improvements.length > 0 && (
        <ul className="list-inside list-disc text-sm text-amber-900">
          {data.improvements.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function FeedbackReport({
  brief,
  feedback,
  onStartOver,
  onPracticeAgain,
}: FeedbackReportProps) {
  const categoryMap = {
    content: feedback.content,
    delivery: feedback.delivery,
    language: feedback.language,
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-1 font-semibold">Overall</h2>
        <p className="text-sm">{feedback.overallSummary}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="text-sm font-medium text-[var(--muted)]">Timing</h3>
          <p className="text-2xl font-semibold">
            {feedback.timing.durationSeconds}s
            <span className="text-base font-normal text-[var(--muted)]">
              {" "}
              / {feedback.timing.limitSeconds}s limit
            </span>
          </p>
          <p
            className={`mt-1 text-sm ${feedback.timing.withinLimit ? "text-green-700" : "text-amber-700"}`}
          >
            {feedback.timing.withinLimit
              ? "Within your target time"
              : `${feedback.timing.percentOfLimit}% of limit used`}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="text-sm font-medium text-[var(--muted)]">Fillers</h3>
          <p className="text-2xl font-semibold">{feedback.fillers.count}</p>
          {feedback.fillers.examples.length > 0 && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              e.g. {feedback.fillers.examples.join(", ")}
            </p>
          )}
        </div>
      </section>

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

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 font-semibold">Audience takeaways</h2>
        <ul className="flex flex-col gap-3">
          {feedback.takeawayAlignment.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-lg border border-[var(--border)] p-3 text-sm"
            >
              <span
                className={`mt-0.5 shrink-0 text-lg ${item.addressed ? "text-green-600" : "text-amber-500"}`}
                aria-hidden
              >
                {item.addressed ? "✓" : "○"}
              </span>
              <div>
                <p className="font-medium">
                  {item.takeaway || brief.takeaways[i]}
                </p>
                <p className="text-[var(--muted)]">{item.notes}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <details className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Transcript
        </summary>
        <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--muted)]">
          {feedback.transcript}
        </p>
      </details>

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
          className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm"
        >
          New speech brief
        </button>
      </div>
    </div>
  );
}
