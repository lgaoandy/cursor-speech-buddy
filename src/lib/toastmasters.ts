import type { SpeechFormat, WatchForCriteria } from "@/types/speech";

export interface FormatMeta {
  value: SpeechFormat;
  label: string;
  hint: string;
  minSeconds: number;
  maxSeconds: number;
}

export const SPEECH_FORMATS: FormatMeta[] = [
  {
    value: "toastmasters",
    label: "Toastmasters speech",
    hint: "4 – 6 min",
    minSeconds: 240,
    maxSeconds: 360,
  },
  {
    value: "pitch",
    label: "Pitch deck",
    hint: "3 – 5 min",
    minSeconds: 180,
    maxSeconds: 300,
  },
  {
    value: "elevator-pitch",
    label: "Elevator pitch",
    hint: "30 – 90 sec",
    minSeconds: 30,
    maxSeconds: 90,
  },
  {
    value: "wedding",
    label: "Wedding / celebration toast",
    hint: "2 – 5 min",
    minSeconds: 120,
    maxSeconds: 300,
  },
  {
    value: "keynote",
    label: "Conference talk",
    hint: "10 – 15 min",
    minSeconds: 600,
    maxSeconds: 900,
  },
  {
    value: "status-update",
    label: "Status update / stand-up",
    hint: "1 – 2 min",
    minSeconds: 60,
    maxSeconds: 120,
  },
  {
    value: "other",
    label: "Other",
    hint: "4 – 6 min",
    minSeconds: 240,
    maxSeconds: 360,
  },
];

/** Look up default time range for a given format. */
export function getFormatDefaults(
  format: SpeechFormat,
): { minSeconds: number; maxSeconds: number } {
  return (
    SPEECH_FORMATS.find((f) => f.value === format) ?? SPEECH_FORMATS[0]
  );
}

export const WATCH_FOR_OPTIONS: {
  value: WatchForCriteria;
  label: string;
  description: string;
}[] = [
  {
    value: "grammar",
    label: "Grammar & word choice",
    description: "Clear, correct language without jargon overload",
  },
  {
    value: "timing",
    label: "Timing",
    description: "Stay within your stated time limit",
  },
  {
    value: "fillers",
    label: "Um / ah / fillers",
    description: "Minimize verbal pauses and filler words",
  },
  {
    value: "structure",
    label: "Structure",
    description: "Strong opening, body, and conclusion",
  },
  {
    value: "engagement",
    label: "Audience engagement",
    description: "Energy, variety, and connection with listeners",
  },
  {
    value: "content",
    label: "Content relevance",
    description: "Message aligns with title and description",
  },
];

export interface ToastmastersPath {
  value: string;
  label: string;
  focus: string;
}

export const TOASTMASTERS_PATHS: ToastmastersPath[] = [
  {
    value: "dynamic-leadership",
    label: "Dynamic Leadership",
    focus: "Strategic leadership, conflict resolution, and facilitating change",
  },
  {
    value: "engaging-humor",
    label: "Engaging Humor",
    focus: "Humorous public speaking and using humor effectively in speeches",
  },
  {
    value: "motivational-strategies",
    label: "Motivational Strategies",
    focus: "Building connections, understanding motivation, and leading small groups",
  },
  {
    value: "persuasive-influence",
    label: "Persuasive Influence",
    focus: "Innovative communication and leadership through persuasion",
  },
  {
    value: "presentation-mastery",
    label: "Presentation Mastery",
    focus: "Public speaking technique, speech writing, and delivery",
  },
  {
    value: "visionary-communication",
    label: "Visionary Communication",
    focus: "Effective communication and leadership with a long-term vision",
  },
];

/** Toastmasters-style evaluation categories shown in the feedback report */
export const EVALUATION_CATEGORIES = [
  {
    key: "content" as const,
    title: "Content",
    hint: "Speech development, clarity, relevance, and impact",
  },
  {
    key: "delivery" as const,
    title: "Delivery",
    hint: "Voice, pace, pauses, energy, and presence",
  },
  {
    key: "language" as const,
    title: "Language",
    hint: "Grammar, word choice, and concision",
  },
];
