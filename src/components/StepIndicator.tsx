import type { AppStep } from "@/types/speech";

const STEPS: { id: AppStep; label: string }[] = [
  { id: "brief", label: "Speech Brief" },
  { id: "practice", label: "Practice" },
  { id: "feedback", label: "Feedback" },
];

const ARROW = 20; // px — depth of the right-pointing arrow

// Every step: flat left edge, arrow on the right
const CLIP = `polygon(0 0, calc(100% - ${ARROW}px) 0, 100% 50%, calc(100% - ${ARROW}px) 100%, 0 100%)`;

interface StepIndicatorProps {
  current: AppStep;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Progress" className="flex h-14">
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = step.id === current;
        const isLast = index === STEPS.length - 1;

        const bg = active
          ? "var(--accent)"
          : done
            ? "var(--foreground)"
            : "#b8b8af";

        const textColor = active ? "var(--accent-fg)" : "#ffffff";
        const numBg = active ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.22)";

        return (
          <div
            key={step.id}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 select-none"
            style={{
              clipPath: CLIP,
              backgroundColor: bg,
              // Earlier steps overlap later ones: pull next step leftward
              marginRight: isLast ? 0 : -ARROW,
              // Higher z-index = earlier step = sits on top
              zIndex: STEPS.length - index,
              // Shift content right on non-first steps so it clears the
              // area covered by the previous step's arrow
              paddingLeft: index === 0 ? 8 : ARROW + 4,
              paddingRight: ARROW + 8,
            }}
            aria-current={active ? "step" : undefined}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ backgroundColor: numBg, color: textColor }}
            >
              {index + 1}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-wide leading-tight text-center"
              style={{ color: textColor }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
