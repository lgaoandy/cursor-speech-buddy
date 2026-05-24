import { useEffect, useRef, useState } from "react";
import type { HistoryStore } from "@/lib/history";
import type { HistoryEntry } from "@/types/speech";
import { formatHistoryDate, formatDurationLabel } from "@/lib/format";
import { ScoreRing } from "@/components/ScoreRing";

type AudioState = "idle" | "loading" | "loaded" | "no-audio" | "fetch-error" | "playback-error";

function AudioPlayer({
  entryId,
  store,
}: {
  entryId: string;
  store: HistoryStore;
}) {
  const [state, setState] = useState<AudioState>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  // Revoke objectURL on unmount to free memory
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const loadAudio = async () => {
    if (state !== "idle" && state !== "fetch-error") return;
    setState("loading");
    try {
      const result = (await store.getAudioUrl?.(entryId)) ?? null;
      if (!result) {
        setState("no-audio");
        return;
      }
      urlRef.current = result;
      setUrl(result);
      setState("loaded");
    } catch (err) {
      console.error("[AudioPlayer] getAudioUrl failed:", err);
      setState("fetch-error");
    }
  };

  if (state === "idle" || state === "fetch-error") {
    return (
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={loadAudio}
          className="text-xs text-[var(--accent)] underline underline-offset-2"
        >
          ▶ Play recording
        </button>
        {state === "fetch-error" && (
          <span className="text-xs text-red-600">Failed to load — tap to retry</span>
        )}
      </div>
    );
  }

  if (state === "loading") {
    return <p className="mt-2 text-xs text-[var(--muted)]">Loading…</p>;
  }

  if (state === "no-audio") {
    return (
      <p className="mt-2 text-xs text-[var(--muted)]">No recording saved</p>
    );
  }

  if (state === "playback-error") {
    return (
      <p className="mt-2 text-xs text-red-600">
        Recording couldn't be played — the file may no longer be accessible.
      </p>
    );
  }

  // state === "loaded"
  // crossOrigin="use-credentials" is required so the browser sends the session
  // cookie to the backend proxy endpoint (/history/:id/audio).
  return (
    <audio
      controls
      src={url ?? undefined}
      crossOrigin="use-credentials"
      className="mt-2 w-full"
      onError={() => setState("playback-error")}
    >
      <track kind="captions" />
    </audio>
  );
}

interface HistoryPageProps {
  historyStore: HistoryStore;
  isGuest: boolean;
  onBack: () => void;
  onViewEntry: (entry: HistoryEntry) => void;
  onSignIn: () => void;
}

export function HistoryPage({
  historyStore,
  isGuest,
  onBack,
  onViewEntry,
  onSignIn,
}: HistoryPageProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    historyStore.getAll().then(setEntries).catch(() => {
      setActionError("Failed to load history.");
    });
  }, [historyStore]);

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await historyStore.delete(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setConfirmClearId(null);
    } catch {
      setActionError("Failed to delete entry. Try again.");
      setConfirmClearId(null);
    }
  };

  const handleClearAll = async () => {
    setActionError(null);
    try {
      await historyStore.clear();
      setEntries([]);
      setConfirmClearId(null);
    } catch {
      setActionError("Failed to clear history. Try again.");
      setConfirmClearId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Guest sync banner */}
      {isGuest && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="text-amber-800">
            History is saved on this device only.{" "}
            <span className="font-medium">Sign in to sync across devices.</span>
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
          >
            Sign in
          </button>
        </div>
      )}

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
          {entries.length > 0 &&
            (confirmClearId === "all" ? (
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
            ))}
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {actionError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {actionError}
        </p>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] py-16 text-center">
          <p className="text-4xl" aria-hidden>
            🎙️
          </p>
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
                <ScoreRing score={entry.averageScore} size={44} />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{entry.brief.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatHistoryDate(entry.createdAt)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                    <span>
                      ⏱ {formatDurationLabel(entry.feedback.timing.durationSeconds)}{" "}
                      <span
                        className={
                          entry.feedback.timing.withinRange
                            ? "text-green-700"
                            : "text-amber-700"
                        }
                      >
                        {entry.feedback.timing.withinRange
                          ? "✓ on time"
                          : "over limit"}
                      </span>
                    </span>
                    <span>💬 {entry.feedback.fillers.count} fillers</span>
                    <span className="capitalize">📋 {entry.brief.format}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {(["content", "delivery", "language"] as const).map(
                      (cat) => (
                        <span
                          key={cat}
                          className="rounded-full border border-[var(--border)] px-2 py-0.5 capitalize"
                        >
                          {cat} {entry.feedback[cat].score}
                        </span>
                      ),
                    )}
                  </div>

                  {historyStore.getAudioUrl && (
                    <AudioPlayer entryId={entry.id} store={historyStore} />
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
