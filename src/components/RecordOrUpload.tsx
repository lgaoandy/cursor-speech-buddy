import { useCallback, useEffect, useRef, useState } from "react";
import { RecordingTimer } from "@/components/RecordingTimer";

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
  const [error, setError] = useState<string | null>(null);

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

  const startRecording = async () => {
    setError(null);
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
    } catch {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    setError(null);
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
        minutes for faster analysis.
      </p>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
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
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Start recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
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
