interface RecordingTimerProps {
  durationSeconds: number;
  timeLimitSeconds: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getTimerState(
  durationSeconds: number,
  timeLimitSeconds: number,
): "ok" | "warning" | "over" {
  if (durationSeconds <= timeLimitSeconds) return "ok";
  if (durationSeconds <= timeLimitSeconds + 60) return "warning";
  return "over";
}

const BG_COLORS = {
  ok: "bg-green-500",
  warning: "bg-yellow-400",
  over: "bg-red-500",
} as const;

const STATUS_LABELS = {
  ok: "Within time limit",
  warning: "Time limit reached",
  over: "1 minute over limit",
} as const;

export function RecordingTimer({
  durationSeconds,
  timeLimitSeconds,
}: RecordingTimerProps) {
  const state = getTimerState(durationSeconds, timeLimitSeconds);

  return (
    <div
      className={`
        flex w-full flex-col items-center justify-center gap-3
        rounded-2xl px-8 py-10 transition-colors duration-700
        ${BG_COLORS[state]}
      `}
      role="timer"
      aria-live="off"
      aria-label={`Recording time: ${formatTime(durationSeconds)}`}
    >
      {/* Clock display — capped at ~40% of element height via font size + padding ratio */}
      <span
        className="select-none font-mono font-bold tracking-widest text-white"
        style={{
          fontSize: "clamp(3.5rem, 10vw, 6rem)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          // Tabular nums keep digit width consistent so the clock doesn't jump
          textShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        {formatTime(durationSeconds)}
      </span>

      {/* Status label below the clock */}
      <span className="text-sm font-medium text-white/80 tracking-wide uppercase">
        {STATUS_LABELS[state]}
      </span>

      {/* Time limit reference */}
      <span className="text-xs text-white/60">
        limit: {formatTime(timeLimitSeconds)}
      </span>
    </div>
  );
}
