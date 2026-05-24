import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { SpeechBriefForm } from "@/components/SpeechBriefForm";
import { RecordOrUpload } from "@/components/RecordOrUpload";
import { FeedbackReport } from "@/components/FeedbackReport";
import { HistoryPage } from "@/components/HistoryPage";
import { AnalyzingOverlay } from "@/components/AnalyzingOverlay";
import { analyzeSpeech } from "@/lib/analyze";
import { historyStore } from "@/lib/history";
import type { AppStep, SpeechBrief, SpeechFeedback, HistoryEntry } from "@/types/speech";
import { EMPTY_BRIEF } from "@/types/speech";

const BRIEF_STORAGE_KEY = "speech-buddy:brief-draft";

function loadSavedBrief(): SpeechBrief {
  try {
    const raw = localStorage.getItem(BRIEF_STORAGE_KEY);
    if (!raw) return EMPTY_BRIEF;
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Migrate minMinutes/maxMinutes → minSeconds/maxSeconds
    const minSeconds =
      typeof parsed.minSeconds === "number" && parsed.minSeconds > 0
        ? parsed.minSeconds
        : typeof parsed.minMinutes === "number" && parsed.minMinutes > 0
          ? parsed.minMinutes * 60
          : EMPTY_BRIEF.minSeconds;

    const maxSeconds =
      typeof parsed.maxSeconds === "number" && parsed.maxSeconds > minSeconds
        ? parsed.maxSeconds
        : typeof parsed.maxMinutes === "number" &&
            parsed.maxMinutes * 60 > minSeconds
          ? parsed.maxMinutes * 60
          : EMPTY_BRIEF.maxSeconds;

    return { ...EMPTY_BRIEF, ...(parsed as Partial<SpeechBrief>), minSeconds, maxSeconds };
  } catch {
    return EMPTY_BRIEF;
  }
}

export default function App() {
  const [step, setStep] = useState<AppStep>("brief");
  const [brief, setBrief] = useState<SpeechBrief>(loadSavedBrief);
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  // Persist brief to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(brief));
  }, [brief]);

  const handleAnalyze = async (audio: Blob, durationSeconds: number) => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await analyzeSpeech(brief, audio, durationSeconds);
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        brief,
        feedback: result,
        averageScore:
          Math.round(
            ((result.content.score + result.delivery.score + result.language.score) / 3) * 10,
          ) / 10,
      };
      await historyStore.save(entry);
      // Save audio blob alongside the entry (Option B — IndexedDB)
      await historyStore.saveAudio?.(entry.id, audio);
      setSavedEntryId(entry.id);
      setFeedback(result);
      setStep("feedback");
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : "Analysis failed. Try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startOver = () => {
    localStorage.removeItem(BRIEF_STORAGE_KEY);
    setBrief(EMPTY_BRIEF);
    setFeedback(null);
    setAnalyzeError(null);
    setSavedEntryId(null);
    setStep("brief");
  };

  const viewHistoryEntry = (entry: HistoryEntry) => {
    setBrief(entry.brief);
    setFeedback(entry.feedback);
    setSavedEntryId(entry.id);
    setStep("feedback");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {isAnalyzing && <AnalyzingOverlay />}
      <Header onHistoryClick={() => setStep("history")} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        {step !== "history" && <StepIndicator current={step} />}

        {step === "brief" && (
          <section>
            <h2 className="mb-1 text-lg font-semibold">Plan your speech</h2>
            <p className="mb-6 text-sm text-[var(--muted)]">
              Tell us about your talk so feedback can focus on what matters to
              you and your audience.
            </p>
            <SpeechBriefForm
              brief={brief}
              onChange={setBrief}
              onContinue={() => setStep("practice")}
            />
          </section>
        )}

        {step === "practice" && (
          <section>
            <h2 className="mb-1 text-lg font-semibold">Practice</h2>
            <p className="mb-2 text-sm font-medium">{brief.title}</p>
            {analyzeError && (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {analyzeError}
              </p>
            )}
            <RecordOrUpload
              onBack={() => setStep("brief")}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              minSeconds={brief.minSeconds}
              maxSeconds={brief.maxSeconds}
            />
          </section>
        )}

        {step === "feedback" && feedback && (
          <section>
            <h2 className="mb-1 text-lg font-semibold">Your feedback</h2>
            <p className="mb-6 text-sm text-[var(--muted)]">{brief.title}</p>
            <FeedbackReport
              brief={brief}
              feedback={feedback}
              savedEntryId={savedEntryId}
              onStartOver={startOver}
              onPracticeAgain={() => {
                setFeedback(null);
                setSavedEntryId(null);
                setStep("practice");
              }}
            />
          </section>
        )}

        {step === "history" && (
          <HistoryPage
            onBack={() => setStep("brief")}
            onViewEntry={viewHistoryEntry}
          />
        )}
      </main>
    </div>
  );
}
