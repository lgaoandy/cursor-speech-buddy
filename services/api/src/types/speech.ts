export type SpeechFormat =
  | "toastmasters"
  | "pitch"
  | "wedding"
  | "keynote"
  | "status-update"
  | "other";

export type WatchForCriteria =
  | "grammar"
  | "timing"
  | "fillers"
  | "structure"
  | "engagement"
  | "content";

export interface SpeechBrief {
  format: SpeechFormat;
  title: string;
  description: string;
  takeaways: [string, string, string];
  timeLimitMinutes: number;
  watchFor: WatchForCriteria[];
}

export interface TimingMetrics {
  durationSeconds: number;
  limitSeconds: number;
  withinLimit: boolean;
  percentOfLimit: number;
}

export interface FillerMetrics {
  count: number;
  examples: string[];
}

export interface CategoryFeedback {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface TakeawayAlignment {
  takeaway: string;
  addressed: boolean;
  notes: string;
}

export interface SpeechFeedback {
  transcript: string;
  timing: TimingMetrics;
  fillers: FillerMetrics;
  content: CategoryFeedback;
  delivery: CategoryFeedback;
  language: CategoryFeedback;
  takeawayAlignment: TakeawayAlignment[];
  overallSummary: string;
}
