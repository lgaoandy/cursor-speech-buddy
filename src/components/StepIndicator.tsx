import type { AppStep } from "@/types/speech";

const STEPS: { id: AppStep; label: string }[] = [
  { id: "brief", label: "Speech brief" },
  { id: "practice", label: "Practice" },
  { id: "feedback", label: "Feedback" },
];

interface StepIndicatorProps {
  current: AppStep;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Progress" className="flex gap-2">
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = step.id === current;
        return (
          <div
            key={step.id}
            className={`flex flex-1 flex-col gap-1 rounded-lg border px-3 py-2 text-center text-xs ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-muted)] font-medium text-[var(--accent)]"
                : done
                  ? "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"
            }`}
          >
            <span className="font-semibold">{index + 1}</span>
            <span>{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
