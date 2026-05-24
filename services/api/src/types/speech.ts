export type SpeechFormat =
  | "toastmasters"
  | "pitch"
  | "elevator-pitch"
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
  toastmastersPath?: string;
  title: string;
  description: string;
  takeaways: [string, string, string];
  minSeconds: number;
  maxSeconds: number;
  watchFor: WatchForCriteria[];
}

export interface TimingMetrics {
  durationSeconds: number;
  minSeconds: number;
  maxSeconds: number;
  withinRange: boolean;
  percentOfMax: number;
}

export interface FillerMetrics {
  count: number;
  breakdown: Record<string, number>;
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
