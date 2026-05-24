import { formatMMSS } from "@/lib/format";

interface RecordingTimerProps {
  durationSeconds: number;
  minSeconds: number;
  maxSeconds: number;
}

type TimerState = "below" | "inrange" | "over";

function getTimerState(
  durationSeconds: number,
  minSeconds: number,
  maxSeconds: number,
): TimerState {
  if (durationSeconds > maxSeconds) return "over";
  if (durationSeconds >= minSeconds) return "inrange";
  return "below";
}

const BG_COLORS: Record<TimerState, string> = {
  below: "bg-green-500",
  inrange: "bg-amber-400",
  over: "bg-red-500",
};

const STATUS_LABELS: Record<TimerState, string> = {
  below: "Keep going",
  inrange: "In target window",
  over: "Over maximum — wrap up",
};

export function RecordingTimer({
  durationSeconds,
  minSeconds,
  maxSeconds,
}: RecordingTimerProps) {
  const state = getTimerState(durationSeconds, minSeconds, maxSeconds);

  return (
    <div
      className={`
        flex w-full flex-col items-center justify-center gap-3
        rounded-2xl px-8 py-10 transition-colors duration-700
        ${BG_COLORS[state]}
      `}
      role="timer"
      aria-live="off"
      aria-label={`Recording time: ${formatMMSS(durationSeconds)}`}
    >
      <span
        className="select-none font-mono font-bold tracking-widest text-white"
        style={{
          fontSize: "clamp(3.5rem, 10vw, 6rem)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          textShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        {formatMMSS(durationSeconds)}
      </span>

      <span className="text-sm font-medium uppercase tracking-wide text-white/80">
        {STATUS_LABELS[state]}
      </span>

      <span className="text-xs text-white/60">
        Target: {formatMMSS(minSeconds)} – {formatMMSS(maxSeconds)}
      </span>
    </div>
  );
}
