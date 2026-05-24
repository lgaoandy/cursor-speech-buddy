import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 80;
const MIN_BAR_HEIGHT = 0.08;

async function decodeWaveform(blob: Blob): Promise<number[]> {
  const ctx = new AudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  ctx.close();

  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / BAR_COUNT);
  const raw: number[] = [];

  for (let i = 0; i < BAR_COUNT; i++) {
    let sum = 0;
    const offset = i * blockSize;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[offset + j]);
    }
    raw.push(sum / blockSize);
  }

  const max = Math.max(...raw, 0.001);
  return raw.map((v) => {
    // Square-root curve boosts quiet sections so they show variation
    // rather than clamping to a flat floor.
    const curved = Math.sqrt(v / max);
    // Scale into [MIN, 1] so the smallest bar is a visible nub, not zero.
    return MIN_BAR_HEIGHT + curved * (1 - MIN_BAR_HEIGHT);
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Deterministic skeleton using the same [MIN, 1] scale as decoded waveforms
const SKELETON_BARS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const wave = Math.abs(Math.sin((i / BAR_COUNT) * Math.PI * 6));
  return MIN_BAR_HEIGHT + wave * (1 - MIN_BAR_HEIGHT);
});

interface WaveformPlayerProps {
  audioUrl: string;
  audioBlob: Blob;
}

export function WaveformPlayer({ audioUrl, audioBlob }: WaveformPlayerProps) {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setWaveform([]);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    decodeWaveform(audioBlob)
      .then(setWaveform)
      .catch(() => setWaveform(SKELETON_BARS));
  }, [audioBlob]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(1, ratio)) * duration;
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const playedBars = Math.round(progress * BAR_COUNT);
  const bars = waveform.length > 0 ? waveform : SKELETON_BARS;
  const isLoading = waveform.length === 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
      />

      {/* Waveform bars */}
      <div
        className="cursor-pointer select-none"
        role="slider"
        aria-label="Audio position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        onClick={handleSeek}
      >
        {/* Main waveform — bars grow upward */}
        <div className="flex h-16 items-end gap-px">
          {bars.map((amplitude, i) => {
            const played = i < playedBars;
            return (
              <div
                key={i}
                className={`flex-1 transition-colors duration-75 ${isLoading ? "animate-pulse" : ""}`}
                style={{
                  borderRadius: 2,
                  height: `${amplitude * 100}%`,
                  backgroundColor: played ? "var(--accent)" : "#d1d5db",
                  minHeight: 2,
                }}
              />
            );
          })}
        </div>

        {/* Mirrored reflection — 60% height, flipped, faded */}
        <div className="flex h-10 items-start gap-px" aria-hidden>
          {bars.map((amplitude, i) => {
            const played = i < playedBars;
            return (
              <div
                key={i}
                className={`flex-1 transition-colors duration-75 ${isLoading ? "animate-pulse" : ""}`}
                style={{
                  borderRadius: 2,
                  height: `${amplitude * 60}%`,
                  backgroundColor: played ? "var(--accent)" : "#d1d5db",
                  opacity: 0.25,
                  minHeight: 1,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Controls row */}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-sm hover:opacity-90 active:scale-95 transition-transform"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" aria-hidden>
              <rect x="0" y="0" width="3.5" height="12" rx="1" />
              <rect x="6.5" y="0" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor" aria-hidden>
              <path d="M1 0.5L10.5 6L1 11.5V0.5Z" />
            </svg>
          )}
        </button>

        <span className="text-xs tabular-nums text-[var(--muted)]">
          {formatTime(currentTime)}
          <span className="mx-1 opacity-50">/</span>
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
