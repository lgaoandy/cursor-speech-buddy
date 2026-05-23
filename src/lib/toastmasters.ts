import type { SpeechFormat, WatchForCriteria } from "@/types/speech";

export const SPEECH_FORMATS: { value: SpeechFormat; label: string }[] = [
  { value: "toastmasters", label: "Toastmasters manual speech" },
  { value: "pitch", label: "Pitch / investor deck" },
  { value: "wedding", label: "Wedding / celebration toast" },
  { value: "keynote", label: "Keynote / conference talk" },
  { value: "status-update", label: "Status update / stand-up" },
  { value: "other", label: "Other" },
];

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

export const FILLER_PATTERNS =
  /\b(um+|uh+|ah+|er+|like|you know|sort of|kind of)\b/gi;
