import { useState } from "react";
import type { SpeechBrief } from "@/types/speech";
import { SPEECH_FORMATS, WATCH_FOR_OPTIONS } from "@/lib/toastmasters";
import { TimePickerModal } from "@/components/TimePickerModal";

interface SpeechBriefFormProps {
  brief: SpeechBrief;
  onChange: (brief: SpeechBrief) => void;
  onContinue: () => void;
}

type PickerTarget = "min" | "max" | null;

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Count how many takeaway slots are currently in use (at least 1). */
function initialVisibleCount(takeaways: [string, string, string]): 1 | 2 | 3 {
  if (takeaways[2].trim().length > 0) return 3;
  if (takeaways[1].trim().length > 0) return 2;
  return 1;
}

export function SpeechBriefForm({
  brief,
  onChange,
  onContinue,
}: SpeechBriefFormProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [visibleTakeaways, setVisibleTakeaways] = useState<1 | 2 | 3>(
    () => initialVisibleCount(brief.takeaways),
  );

  const update = <K extends keyof SpeechBrief>(key: K, value: SpeechBrief[K]) =>
    onChange({ ...brief, [key]: value });

  const handlePickerConfirm = (totalSeconds: number) => {
    if (pickerTarget === "min") {
      onChange({
        ...brief,
        minSeconds: totalSeconds,
        maxSeconds: Math.max(brief.maxSeconds, totalSeconds + 1),
      });
    } else if (pickerTarget === "max") {
      onChange({
        ...brief,
        maxSeconds: totalSeconds,
        minSeconds: Math.min(brief.minSeconds, totalSeconds - 1),
      });
    }
    setPickerTarget(null);
  };

  const updateTakeaway = (index: 0 | 1 | 2, value: string) => {
    const takeaways = [...brief.takeaways] as [string, string, string];
    takeaways[index] = value;
    onChange({ ...brief, takeaways });
  };

  const removeTakeaway = (index: 1 | 2) => {
    const takeaways = [...brief.takeaways] as [string, string, string];
    // Shift values down so there are no gaps
    for (let i = index; i < 2; i++) {
      takeaways[i as 0 | 1 | 2] = takeaways[(i + 1) as 1 | 2];
    }
    takeaways[2] = "";
    onChange({ ...brief, takeaways });
    setVisibleTakeaways((v) => Math.max(1, v - 1) as 1 | 2 | 3);
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
    brief.takeaways[0].trim().length > 0;

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
        <div className="flex items-baseline justify-between">
          <legend className="text-sm font-medium">
            What should the audience remember?
          </legend>
          <span className="text-xs text-[var(--muted)]">up to 3</span>
        </div>

        {([0, 1, 2] as const)
          .filter((i) => i < visibleTakeaways)
          .map((i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-xs font-semibold text-[var(--accent)]">
                {i + 1}
              </span>
              <input
                type="text"
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
                placeholder={
                  i === 0
                    ? "e.g. Our Q3 goal is growth, not cost-cutting"
                    : `Optional takeaway ${i + 1}`
                }
                value={brief.takeaways[i]}
                onChange={(e) => updateTakeaway(i, e.target.value)}
                required={i === 0}
              />
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => removeTakeaway(i as 1 | 2)}
                  className="shrink-0 rounded-full p-1 text-[var(--muted)] hover:bg-red-50 hover:text-red-500"
                  aria-label={`Remove takeaway ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

        {visibleTakeaways < 3 && (
          <button
            type="button"
            onClick={() =>
              setVisibleTakeaways((v) => Math.min(3, v + 1) as 1 | 2 | 3)
            }
            className="flex items-center gap-2 self-start rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <span className="text-base leading-none">+</span>
            Add another takeaway
          </button>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="flex items-center gap-1 text-sm font-medium">
          Target time range
        </legend>
        <p className="text-xs text-[var(--muted)]">
          Click either value to edit
        </p>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              Minimum
            </span>
            <button
              type="button"
              onClick={() => setPickerTarget("min")}
              className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-muted)] px-5 py-2 font-mono text-2xl font-bold text-[var(--accent)] transition-colors hover:bg-blue-100"
            >
              {formatMmSs(brief.minSeconds)}
            </button>
          </div>

          <span className="mt-4 text-xl font-semibold text-[var(--muted)]">–</span>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              Maximum
            </span>
            <button
              type="button"
              onClick={() => setPickerTarget("max")}
              className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-muted)] px-5 py-2 font-mono text-2xl font-bold text-[var(--accent)] transition-colors hover:bg-blue-100"
            >
              {formatMmSs(brief.maxSeconds)}
            </button>
          </div>
        </div>
        {brief.maxSeconds <= brief.minSeconds && (
          <p className="text-xs text-red-600">
            Maximum must be greater than minimum.
          </p>
        )}
      </fieldset>

      {pickerTarget && (
        <TimePickerModal
          label={pickerTarget === "min" ? "Set minimum time" : "Set maximum time"}
          initialSeconds={
            pickerTarget === "min" ? brief.minSeconds : brief.maxSeconds
          }
          onConfirm={handlePickerConfirm}
          onClose={() => setPickerTarget(null)}
        />
      )}

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
