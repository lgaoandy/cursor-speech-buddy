import type { SpeechBrief } from "@/types/speech";
import { SPEECH_FORMATS, WATCH_FOR_OPTIONS } from "@/lib/toastmasters";

interface SpeechBriefFormProps {
  brief: SpeechBrief;
  onChange: (brief: SpeechBrief) => void;
  onContinue: () => void;
}

export function SpeechBriefForm({
  brief,
  onChange,
  onContinue,
}: SpeechBriefFormProps) {
  const update = <K extends keyof SpeechBrief>(key: K, value: SpeechBrief[K]) =>
    onChange({ ...brief, [key]: value });

  const updateTakeaway = (index: 0 | 1 | 2, value: string) => {
    const takeaways = [...brief.takeaways] as [string, string, string];
    takeaways[index] = value;
    onChange({ ...brief, takeaways });
  };

  const toggleWatchFor = (value: (typeof brief.watchFor)[number]) => {
    const next = brief.watchFor.includes(value)
      ? brief.watchFor.filter((w) => w !== value)
      : [...brief.watchFor, value];
    update("watchFor", next);
  };

  const canContinue =
    brief.title.trim().length > 0 &&
    brief.description.trim().length > 0 &&
    brief.takeaways.every((t) => t.trim().length > 0);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canContinue) onContinue();
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <label htmlFor="format" className="text-sm font-medium">
          Speech format
        </label>
        <select
          id="format"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          value={brief.format}
          onChange={(e) =>
            update("format", e.target.value as SpeechBrief["format"])
          }
        >
          {SPEECH_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          placeholder="e.g. Q3 product roadmap update"
          value={brief.title}
          onChange={(e) => update("title", e.target.value)}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          Brief description
        </label>
        <textarea
          id="description"
          rows={3}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          placeholder="What is this speech about? Who is the audience?"
          value={brief.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">
          Top 3 things the audience should remember
        </legend>
        {([0, 1, 2] as const).map((i) => (
          <input
            key={i}
            type="text"
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
            placeholder={`Takeaway ${i + 1}`}
            value={brief.takeaways[i]}
            onChange={(e) => updateTakeaway(i, e.target.value)}
          />
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label htmlFor="timeLimit" className="text-sm font-medium">
          Target time (minutes)
        </label>
        <input
          id="timeLimit"
          type="number"
          min={1}
          max={30}
          className="w-32 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          value={brief.timeLimitMinutes}
          onChange={(e) =>
            update("timeLimitMinutes", Number(e.target.value) || 1)
          }
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">What should we watch for?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {WATCH_FOR_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 has-checked:border-[var(--accent)] has-checked:bg-[var(--accent-muted)]"
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={brief.watchFor.includes(opt.value)}
                onChange={() => toggleWatchFor(opt.value)}
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-[var(--muted)]">
                  {opt.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={!canContinue}
        className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue to practice
      </button>
    </form>
  );
}
