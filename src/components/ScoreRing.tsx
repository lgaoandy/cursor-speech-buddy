interface ScoreRingProps {
  /** Score on a 0–5 scale. */
  score: number;
  /** Total SVG size in pixels. Stroke + radius are derived from this. */
  size?: number;
  /** When true, render the score as "x/5" instead of just "x". */
  showMax?: boolean;
}

/**
 * Circular progress ring used to visualise a 0–5 score. Same colour ramp as
 * the rest of the report so green = strong, amber = developing, red = work.
 */
export function ScoreRing({ score, size = 56, showMax = false }: ScoreRingProps) {
  // Keep the stroke proportional so the ring reads at any size.
  const stroke = Math.max(3, Math.round(size * 0.09));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fill = (Math.max(0, Math.min(5, score)) / 5) * circumference;
  const gap = circumference - fill;
  const color = score >= 4 ? "#16a34a" : score >= 3 ? "#d97706" : "#dc2626";
  const center = size / 2;
  // Slightly smaller text when the "/5" suffix is shown so it stays inside the ring.
  const fontSize = Math.max(10, Math.round(size * (showMax ? 0.18 : 0.23)));

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="var(--border)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${gap}`}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span
        className="absolute font-bold"
        style={{ color, fontSize }}
        aria-label={`Score ${score} out of 5`}
      >
        {showMax ? `${score}/5` : score}
      </span>
    </div>
  );
}
