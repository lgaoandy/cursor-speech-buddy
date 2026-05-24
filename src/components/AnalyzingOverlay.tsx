import { useEffect, useState } from "react";

const MESSAGES = [
  "Transcribing your speech…",
  "Counting filler words…",
  "Evaluating content and structure…",
  "Checking your three takeaways…",
  "Scoring delivery and language…",
  "Putting your feedback together…",
];

export function AnalyzingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMessageIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 backdrop-blur-sm" style={{ backgroundColor: "color-mix(in srgb, var(--background) 92%, transparent)" }}>
      <div className="flex flex-col items-center gap-8">

        {/* Waveform bars */}
        <div className="flex items-end gap-1.5" aria-hidden>
          {[0.4, 0.7, 1, 0.85, 0.55, 0.9, 0.65, 1, 0.75, 0.45, 0.8, 0.6, 1, 0.7, 0.5].map(
            (height, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-[var(--accent)]"
                style={{
                  height: `${height * 48}px`,
                  animation: `wave 1.2s ease-in-out ${i * 0.08}s infinite alternate`,
                  opacity: 0.7 + height * 0.3,
                }}
              />
            ),
          )}
        </div>

        {/* Rotating ring */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "2s" }}
            viewBox="0 0 64 64"
            fill="none"
          >
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="var(--accent-muted)"
              strokeWidth="4"
            />
            <path
              d="M32 4 A28 28 0 0 1 60 32"
              stroke="var(--accent)"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-2xl" aria-hidden>
            🎙️
          </span>
        </div>

        {/* Cycling status message */}
        <div className="flex flex-col items-center gap-2 text-center">
          <p
            className="text-lg font-semibold text-[var(--foreground)] transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {MESSAGES[messageIndex]}
          </p>
          <p className="text-sm text-[var(--muted)]">
            This takes about 15–30 seconds
          </p>
        </div>

        {/* Dot progress trail */}
        <div className="flex gap-2" aria-hidden>
          {MESSAGES.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === messageIndex ? "24px" : "6px",
                background:
                  i === messageIndex
                    ? "var(--accent)"
                    : "var(--accent-muted)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
