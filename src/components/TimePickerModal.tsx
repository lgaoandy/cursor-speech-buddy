import { useEffect, useRef, useState } from "react";

interface TimePickerModalProps {
  label: string;
  initialSeconds: number;
  onConfirm: (totalSeconds: number) => void;
  onClose: () => void;
}

export function TimePickerModal({
  label,
  initialSeconds,
  onConfirm,
  onClose,
}: TimePickerModalProps) {
  const [minutes, setMinutes] = useState(Math.floor(initialSeconds / 60));
  const [seconds, setSeconds] = useState(initialSeconds % 60);
  const minutesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    minutesRef.current?.focus();
    minutesRef.current?.select();
  }, []);

  const clampMinutes = (v: number) => Math.max(0, Math.min(59, v));
  const clampSeconds = (v: number) => Math.max(0, Math.min(59, v));

  const totalSeconds = minutes * 60 + seconds;
  const isValid = totalSeconds > 0;

  const handleConfirm = () => {
    if (isValid) onConfirm(totalSeconds);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) handleConfirm();
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-[var(--border)] bg-white p-8 shadow-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--muted)]">
          {label}
        </p>

        {/* MM : SS picker */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              Min
            </label>
            <input
              ref={minutesRef}
              type="number"
              min={0}
              max={59}
              value={String(minutes).padStart(2, "0")}
              onChange={(e) =>
                setMinutes(clampMinutes(parseInt(e.target.value) || 0))
              }
              className="w-24 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-muted)] text-center font-mono font-bold text-[var(--accent)] outline-none focus:border-[var(--accent)]"
              style={{ fontSize: "3.5rem", lineHeight: 1.1 }}
            />
          </div>

          <span
            className="font-mono font-bold text-[var(--foreground)]"
            style={{ fontSize: "3rem", lineHeight: 1, marginTop: "1.4rem" }}
          >
            :
          </span>

          <div className="flex flex-col items-center gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              Sec
            </label>
            <input
              type="number"
              min={0}
              max={59}
              value={String(seconds).padStart(2, "0")}
              onChange={(e) =>
                setSeconds(clampSeconds(parseInt(e.target.value) || 0))
              }
              className="w-24 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-muted)] text-center font-mono font-bold text-[var(--accent)] outline-none focus:border-[var(--accent)]"
              style={{ fontSize: "3.5rem", lineHeight: 1.1 }}
            />
          </div>
        </div>

        {!isValid && (
          <p className="text-xs text-red-500">Time must be greater than 0:00</p>
        )}

        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid}
            className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
}
