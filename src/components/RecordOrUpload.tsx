import { useCallback, useEffect, useRef, useState } from "react";
import { RecordingTimer } from "@/components/RecordingTimer";

// ─── Mic error helpers ────────────────────────────────────────────────────────

type MicErrorKind = "denied" | "not-found" | "in-use" | "insecure" | "unknown";

function classifyMicError(err: unknown): MicErrorKind {
  if (!(err instanceof DOMException)) return "unknown";
  switch (err.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "not-found";
    case "NotReadableError":
    case "AbortError":
      return "in-use";
    case "SecurityError":
      return "insecure";
    default:
      return "unknown";
  }
}

function detectPlatform(): "ios" | "android" | "desktop" {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

interface MicErrorInfo {
  title: string;
  steps: string[];
}

function getMicErrorInfo(kind: MicErrorKind): MicErrorInfo {
  const platform = detectPlatform();

  if (kind === "denied") {
    if (platform === "ios") {
      return {
        title: "Microphone access blocked",
        steps: [
          "Open the iOS Settings app",
          'Scroll to Safari (or your browser)',
          'Tap "Microphone" and set it to Allow',
          "Return here and try again",
        ],
      };
    }
    if (platform === "android") {
      return {
        title: "Microphone access blocked",
        steps: [
          "Tap the lock icon in your browser address bar",
          'Tap "Permissions" → "Microphone"',
          'Change it to "Allow"',
          "Refresh the page and try again",
        ],
      };
    }
    return {
      title: "Microphone access blocked",
      steps: [
        "Click the lock icon in your browser address bar",
        'Find "Microphone" and set it to Allow',
        "Refresh the page and try again",
      ],
    };
  }

  if (kind === "not-found") {
    return {
      title: "No microphone detected",
      steps: [
        "Check that a microphone is plugged in or enabled",
        "Try using headphones with a built-in mic",
        "Or upload an audio file instead",
      ],
    };
  }

  if (kind === "in-use") {
    return {
      title: "Microphone is in use by another app",
      steps: [
        "Close any other app using your mic (Zoom, Teams, etc.)",
        "Try again",
      ],
    };
  }

  if (kind === "insecure") {
    return {
      title: "Microphone requires a secure connection",
      steps: [
        "Make sure you are accessing this page over HTTPS",
        "Contact support if the problem persists",
      ],
    };
  }

  return {
    title: "Microphone unavailable",
    steps: [
      "Check your browser and OS microphone permissions",
      "Try refreshing the page",
      "Or upload an audio file instead",
    ],
  };
}

interface RecordOrUploadProps {
  onBack: () => void;
  onAnalyze: (audio: Blob, durationSeconds: number) => void;
  isAnalyzing: boolean;
  timeLimitSeconds: number;
}

export function RecordOrUpload({
  onBack,
  onAnalyze,
  isAnalyzing,
  timeLimitSeconds,
}: RecordOrUploadProps) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [micError, setMicError] = useState<MicErrorInfo | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const clearAudio = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setDurationSeconds(0);
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  const setBlob = (blob: Blob, duration: number) => {
    clearAudio();
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setAudioBlob(blob);
    setDurationSeconds(duration);
  };

  // Spacebar toggles recording — but only when focus is NOT in a text input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || isAnalyzing) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      recording ? stopRecording() : void startRecording();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [recording, isAnalyzing]);

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
        setBlob(blob, duration);
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        setDurationSeconds(
          Math.round((Date.now() - startedAtRef.current) / 1000),
        );
      }, 500);
    } catch (err) {
      setMicError(getMicErrorInfo(classifyMicError(err)));
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    setMicError(null);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioBlob(file);

    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      const d = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0;
      setDurationSeconds(d);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-[var(--muted)]">
        Record a practice run or upload an audio file. Keep demos under 2
        minutes for faster analysis.{" "}
        <span className="text-xs">
          Press <kbd className="rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 font-mono text-xs">Space</kbd> to start / stop.
        </span>
      </p>

      {/* Screen reader announcement for recording state changes */}
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {recording ? "Recording started" : audioBlob ? "Recording stopped" : ""}
      </p>

      {micError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <p className="mb-2 font-semibold">{micError.title}</p>
          <ol className="list-inside list-decimal space-y-1 text-red-700">
            {micError.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Timer — only visible while recording */}
      {recording && (
        <RecordingTimer
          durationSeconds={durationSeconds}
          timeLimitSeconds={timeLimitSeconds}
        />
      )}

      <div className="flex flex-wrap gap-3">
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={isAnalyzing}
            aria-pressed={false}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Start recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            aria-pressed={true}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Stop recording
          </button>
        )}

        <label className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium">
          Upload audio
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            disabled={isAnalyzing}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {audioBlob && (
          <button
            type="button"
            onClick={clearAudio}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {audioUrl && (
        <audio controls src={audioUrl} className="w-full">
          <track kind="captions" />
        </audio>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isAnalyzing}
          className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!audioBlob || isAnalyzing}
          onClick={() => audioBlob && onAnalyze(audioBlob, durationSeconds)}
          className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {isAnalyzing ? "Analyzing…" : "Analyze speech"}
        </button>
      </div>
    </div>
  );
}
