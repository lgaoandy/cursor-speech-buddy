import { useEffect, useRef, useState } from "react";
import { historyStore } from "@/lib/history";
import type { HistoryEntry } from "@/types/speech";

function AudioPlayer({ entryId }: { entryId: string }) {
  const [url, setUrl] = useState<string | null | "loading">(null);
  const urlRef = useRef<string | null>(null);

  // Revoke the objectURL when the component unmounts to free memory
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const loadAudio = async () => {
    if (url !== null) return;
    setUrl("loading");
    const result = await historyStore.getAudioUrl?.(entryId) ?? null;
    urlRef.current = result;
    setUrl(result);
  };

  if (url === null) {
    return (
      <button
        type="button"
        onClick={loadAudio}
        className="mt-2 text-xs text-[var(--accent)] underline underline-offset-2"
      >
        ▶ Play recording
      </button>
    );
  }

  if (url === "loading") {
    return <p className="mt-2 text-xs text-[var(--muted)]">Loading…</p>;
  }

  if (!url) {
    return <p className="mt-2 text-xs text-[var(--muted)]">No recording saved</p>;
  }

  return (
    <audio controls src={url} className="mt-2 w-full">
      <track kind="captions" />
    </audio>
  );
}

const RING_RADIUS = 16;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function MiniScoreRing({ score }: { score: number }) {
  const fill = (score / 5) * RING_CIRCUMFERENCE;
  const gap = RING_CIRCUMFERENCE - fill;
  const color = score >= 4 ? "#16a34a" : score >= 3 ? "#d97706" : "#dc2626";

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: 44, height: 44 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
        <circle cx="22" cy="22" r={RING_RADIUS} stroke="var(--border)" strokeWidth="3" fill="none" />
        <circle
          cx="22" cy="22" r={RING_RADIUS}
          stroke={color} strokeWidth="3" fill="none"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${gap}`}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }} aria-label={`Average score ${score}`}>
        {score}
      </span>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface HistoryPageProps {
  onBack: () => void;
  onViewEntry: (entry: HistoryEntry) => void;
}

export function HistoryPage({ onBack, onViewEntry }: HistoryPageProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null);

  useEffect(() => {
    historyStore.getAll().then(setEntries);
  }, []);

  const handleDelete = async (id: string) => {
    await historyStore.delete(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setConfirmClearId(null);
  };

  const handleClearAll = async () => {
    await historyStore.clear();
    setEntries([]);
    setConfirmClearId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">History</h2>
          <p className="text-sm text-[var(--muted)]">
            {entries.length === 0
              ? "No sessions yet"
              : `${entries.length} session${entries.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          {entries.length > 0 && (
            confirmClearId === "all" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted)]">Clear all?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Yes, clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearId(null)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearId("all")}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)]"
              >
                Clear all
              </button>
            )
          )}
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] py-16 text-center">
          <p className="text-4xl" aria-hidden>🎙️</p>
          <p className="font-medium">No past sessions yet</p>
          <p className="text-sm text-[var(--muted)]">
            Record your first speech to start building your history.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Start a session
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex items-start gap-3">
                <MiniScoreRing score={entry.averageScore} />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{entry.brief.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDate(entry.createdAt)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                    <span>
                      ⏱ {formatDuration(entry.feedback.timing.durationSeconds)}
                      {" "}
                      <span className={entry.feedback.timing.withinLimit ? "text-green-700" : "text-amber-700"}>
                        {entry.feedback.timing.withinLimit ? "✓ on time" : "over limit"}
                      </span>
                    </span>
                    <span>💬 {entry.feedback.fillers.count} fillers</span>
                    <span className="capitalize">📋 {entry.brief.format}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {(["content", "delivery", "language"] as const).map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full border border-[var(--border)] px-2 py-0.5 capitalize"
                      >
                        {cat} {entry.feedback[cat].score}
                      </span>
                    ))}
                  </div>

                  {historyStore.getAudioUrl && (
                    <AudioPlayer entryId={entry.id} />
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => onViewEntry(entry)}
                    className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
                  >
                    View
                  </button>
                  {confirmClearId === entry.id ? (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearId(null)}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearId(entry.id)}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)]"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
