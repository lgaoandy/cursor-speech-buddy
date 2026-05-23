import { useState } from "react";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { SpeechBriefForm } from "@/components/SpeechBriefForm";
import { RecordOrUpload } from "@/components/RecordOrUpload";
import { FeedbackReport } from "@/components/FeedbackReport";
import { AnalyzingOverlay } from "@/components/AnalyzingOverlay";
import { analyzeSpeech } from "@/lib/analyze";
import type { AppStep, SpeechBrief, SpeechFeedback } from "@/types/speech";
import { EMPTY_BRIEF } from "@/types/speech";

export default function App() {
  const [step, setStep] = useState<AppStep>("brief");
  const [brief, setBrief] = useState<SpeechBrief>(EMPTY_BRIEF);
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const handleAnalyze = async (audio: Blob, durationSeconds: number) => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await analyzeSpeech(brief, audio, durationSeconds);
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
    setBrief(EMPTY_BRIEF);
    setFeedback(null);
    setAnalyzeError(null);
    setStep("brief");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {isAnalyzing && <AnalyzingOverlay />}
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <StepIndicator current={step} />

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
              onStartOver={startOver}
              onPracticeAgain={() => {
                setFeedback(null);
                setStep("practice");
              }}
            />
          </section>
        )}
      </main>
    </div>
  );
}
