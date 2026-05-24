import type { SpeechBrief } from "@shared/types/speech";

export * from "@shared/types/speech";

export type AppStep = "brief" | "practice" | "feedback" | "history";

export const EMPTY_BRIEF: SpeechBrief = {
  format: "toastmasters",
  title: "",
  description: "",
  takeaways: ["", "", ""],
  minSeconds: 240,
  maxSeconds: 360,
  watchFor: ["grammar", "timing", "fillers", "structure"],
};
