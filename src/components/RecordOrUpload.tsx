import { useCallback, useEffect, useRef, useState } from "react";
import { RecordingTimer } from "@/components/RecordingTimer";
import { WaveformPlayer } from "@/components/WaveformPlayer";

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
  minSeconds: number;
  maxSeconds: number;
}

type RecorderState = "idle" | "recording" | "paused";

export function RecordOrUpload({
  onBack,
  onAnalyze,
  isAnalyzing,
  minSeconds,
  maxSeconds,
}: RecordOrUploadProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [micError, setMicError] = useState<MicErrorInfo | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const segmentStartRef = useRef<number>(0);
  const accumulatedSecsRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    segmentStartRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      const segSecs = (Date.now() - segmentStartRef.current) / 1000;
      setDurationSeconds(Math.round(accumulatedSecsRef.current + segSecs));
    }, 500);
  }, []);

  const teardownRecorder = useCallback(() => {
    stopTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
    accumulatedSecsRef.current = 0;
  }, [stopTimer]);

  const clearAudio = useCallback(() => {
    teardownRecorder();
    setAudioUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setAudioBlob(null);
    setDurationSeconds(0);
    setRecorderState("idle");
    setConfirmingClear(false);
  }, [teardownRecorder]);

  const startRecording = useCallback(async () => {
    // Resume the paused session — all chunks are already accumulated
    if (recorderState === "paused" && mediaRecorderRef.current) {
      accumulatedSecsRef.current = durationSeconds;
      setAudioUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      setAudioBlob(null);
      mediaRecorderRef.current.resume();
      setRecorderState("recording");
      startTimer();
      return;
    }

    // Fresh start — tear down any leftover state
    setMicError(null);
    teardownRecorder();
    setAudioUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setAudioBlob(null);
    setDurationSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      accumulatedSecsRef.current = 0;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      // Build a preview blob each time the recorder pauses
      recorder.onpause = () => {
        if (chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
        setAudioBlob(blob);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
      };

      recorder.start(250);
      setRecorderState("recording");
      startTimer();
    } catch (err) {
      setMicError(getMicErrorInfo(classifyMicError(err)));
    }
  }, [recorderState, durationSeconds, teardownRecorder, startTimer]);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    accumulatedSecsRef.current += (Date.now() - segmentStartRef.current) / 1000;
    stopTimer();
    setDurationSeconds(Math.round(accumulatedSecsRef.current));
    recorder.requestData();
    recorder.pause();
    setRecorderState("paused");
  }, [stopTimer]);

  useEffect(() => {
    return () => {
      teardownRecorder();
    };
  }, [teardownRecorder]);

  // Spacebar toggles recording — but only when focus is NOT in a text input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || isAnalyzing) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      if (recorderState === "recording") {
        pauseRecording();
      } else {
        void startRecording();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [recorderState, isAnalyzing, pauseRecording, startRecording]);

  const handleAnalyze = () => {
    if (!audioBlob) return;
    teardownRecorder();
    onAnalyze(audioBlob, durationSeconds);
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    setMicError(null);

    const FIFTY_MB = 50 * 1024 * 1024;
    if (file.size > FIFTY_MB) {
      setMicError({
        title: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
        steps: ["Maximum upload size is 50 MB.", "Try a shorter or compressed recording."],
      });
      return;
    }
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
        {recorderState === "recording" ? "Recording started" : recorderState === "paused" ? "Recording paused" : audioBlob ? "Recording stopped" : ""}
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

      {/* Timer — visible while recording or paused */}
      {recorderState !== "idle" && (
        <RecordingTimer
          durationSeconds={durationSeconds}
          minSeconds={minSeconds}
          maxSeconds={maxSeconds}
        />
      )}

      <div className="flex flex-wrap gap-3">
        {recorderState === "recording" ? (
          <button
            type="button"
            onClick={pauseRecording}
            aria-pressed={true}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
          >
            Stop recording
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={isAnalyzing}
            aria-pressed={false}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-fg)] transition-opacity hover:opacity-80"
          >
            {recorderState === "paused" ? "Resume recording" : "Start recording"}
          </button>
        )}

        <label className={`cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--foreground)] ${recorderState !== "idle" || isAnalyzing ? "pointer-events-none opacity-50" : ""}`}>
          Upload audio
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            disabled={recorderState !== "idle" || isAnalyzing}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {(audioBlob || recorderState !== "idle") && (
          confirmingClear ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <span className="text-sm text-red-700">Discard recording?</span>
              <button
                type="button"
                onClick={() => { setConfirmingClear(false); clearAudio(); }}
                className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-80"
              >
                Yes, discard
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium transition-colors hover:border-[var(--foreground)]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingClear(true)}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--foreground)]"
            >
              Clear
            </button>
          )
        )}
      </div>

      {/* Waveform preview — only shown when paused, not while actively recording */}
      {audioUrl && audioBlob && recorderState !== "recording" && (
        <div className="flex flex-col gap-2">
          <WaveformPlayer key={audioUrl} audioUrl={audioUrl} audioBlob={audioBlob} />
          <div className="flex justify-end">
            <a
              href={audioUrl}
              download="speech-recording.webm"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 1v7M3.5 5.5L6 8l2.5-2.5" />
                <path d="M1.5 10.5h9" />
              </svg>
              Download audio
            </a>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isAnalyzing}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium transition-colors hover:border-[var(--foreground)]"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!audioBlob || isAnalyzing}
          onClick={handleAnalyze}
          className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-[var(--accent-fg)] transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          {isAnalyzing ? "Analyzing…" : "Analyze speech"}
        </button>
      </div>
    </div>
  );
}
