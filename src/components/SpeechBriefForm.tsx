import { useState } from "react";
import type { SpeechBrief } from "@/types/speech";
import {
  SPEECH_FORMATS,
  WATCH_FOR_OPTIONS,
  TOASTMASTERS_PATHS,
  getFormatDefaults,
} from "@/lib/toastmasters";
import { formatMMSS } from "@/lib/format";
import { TimePickerModal } from "@/components/TimePickerModal";

interface SpeechBriefFormProps {
  brief: SpeechBrief;
  onChange: (brief: SpeechBrief) => void;
  onContinue: () => void;
}

type PickerTarget = "min" | "max" | null;

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
    brief.takeaways[0].trim().length > 0;

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (canContinue) onContinue();
      }}
    >
      <fieldset className="flex flex-col gap-3">
      <label htmlFor="format" className="text-sm font-semibold">
          Speech Format
        </label>
        <select
          id="format"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          value={brief.format}
          onChange={(e) => {
            const format = e.target.value as SpeechBrief["format"];
            const defaults = getFormatDefaults(format);
            onChange({ ...brief, format, minSeconds: defaults.minSeconds, maxSeconds: defaults.maxSeconds });
          }}
        >
          {SPEECH_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </fieldset>

      {brief.format === "toastmasters" && (
        <fieldset className="flex flex-col gap-3">
          <label htmlFor="tmPath" className="text-sm font-semibold">
            Learning Path
            <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">
              (optional)
            </span>
          </label>
          <select
            id="tmPath"
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
            value={brief.toastmastersPath ?? ""}
            onChange={(e) =>
              update("toastmastersPath", e.target.value || undefined)
            }
          >
            <option value="">— Select a path —</option>
            {TOASTMASTERS_PATHS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {brief.toastmastersPath && (
            <p className="text-xs text-[var(--muted)]">
              {
                TOASTMASTERS_PATHS.find(
                  (p) => p.value === brief.toastmastersPath,
                )?.focus
              }
            </p>
          )}
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3">
        <label htmlFor="title" className="text-sm font-semibold">
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

      <fieldset className="flex flex-col gap-3">
        <label htmlFor="description" className="text-sm font-semibold">
          Brief Description
          <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">(optional)</span>
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <legend className="text-sm font-semibold">Define Takeaways</legend>
            <p className="text-xs text-[var(--muted)]">What should the audience remember? (up to 3)</p>
          </div>
          {visibleTakeaways < 3 && (
            <button
              type="button"
              onClick={() =>
                setVisibleTakeaways((v) => Math.min(3, v + 1) as 1 | 2 | 3)
              }
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            >
              <span className="text-sm leading-none">+</span>
              Add takeaway
            </button>
          )}
        </div>

        {([0, 1, 2] as const).map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 overflow-hidden transition-all duration-200 ease-in-out"
              style={{
                opacity: i < visibleTakeaways ? 1 : 0,
                maxHeight: i < visibleTakeaways ? "60px" : "0px",
                pointerEvents: i < visibleTakeaways ? "auto" : "none",
              }}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-bold text-white">
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
              {i > 0 ? (
                <button
                  type="button"
                  onClick={() => removeTakeaway(i as 1 | 2)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-red-50 hover:text-red-500"
                  aria-label={`Remove takeaway ${i + 1}`}
                >
                  ✕
                </button>
              ) : (
                <span className="h-7 w-7 shrink-0" aria-hidden />
              )}
            </div>
          ))}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="flex items-center gap-1 text-sm font-semibold">
          Target Time Range
        </legend>
        <p className="text-xs text-[var(--muted)]">
          Click either value to edit
        </p>
        <div className="flex items-center gap-4">
          <button
              type="button"
              onClick={() => setPickerTarget("min")}
              className="flex flex-col items-center gap-1 rounded-xl bg-[var(--foreground)] px-6 pb-3 pt-2.5 shadow-sm transition-opacity hover:opacity-80"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                Minimum
              </span>
              <span className="font-mono text-2xl font-bold text-white">
                {formatMMSS(brief.minSeconds)}
              </span>
            </button>

          <span className="text-xl font-semibold text-[var(--muted)]">–</span>

          <button
              type="button"
              onClick={() => setPickerTarget("max")}
              className="flex flex-col items-center gap-1 rounded-xl bg-[var(--foreground)] px-6 pb-3 pt-2.5 shadow-sm transition-opacity hover:opacity-80"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                Maximum
              </span>
              <span className="font-mono text-2xl font-bold text-white">
                {formatMMSS(brief.maxSeconds)}
              </span>
            </button>
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

      <fieldset className="flex flex-col gap-3 pb-2">
        <legend className="mb-1 text-sm font-semibold">What Should We Watch For?</legend>
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
        className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue to practice
      </button>
    </form>
  );
}
