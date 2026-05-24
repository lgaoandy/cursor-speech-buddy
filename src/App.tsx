import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { SpeechBriefForm } from "@/components/SpeechBriefForm";
import { RecordOrUpload } from "@/components/RecordOrUpload";
import { FeedbackReport } from "@/components/FeedbackReport";
import { HistoryPage } from "@/components/HistoryPage";
import { AnalyzingOverlay } from "@/components/AnalyzingOverlay";
import { AuthChoiceScreen } from "@/components/AuthChoiceScreen";
import { TosGateScreen } from "@/components/TosGateScreen";
import { analyzeSpeech } from "@/lib/analyze";
import { getHistoryStore } from "@/lib/history";
import {
  getCurrentUser,
  hasAuthChoice,
  clearAuthChoice,
} from "@/lib/auth";
import type { GoogleUser } from "@/lib/auth";
import { guestHasAcceptedVersion, fetchTos } from "@/lib/tos";
import type { AppStep, SpeechBrief, SpeechFeedback, HistoryEntry } from "@/types/speech";
import { EMPTY_BRIEF } from "@/types/speech";

const BRIEF_STORAGE_KEY = "speech-buddy:brief-draft";

function loadSavedBrief(): SpeechBrief {
  try {
    const raw = localStorage.getItem(BRIEF_STORAGE_KEY);
    if (!raw) return EMPTY_BRIEF;
    const parsed = JSON.parse(raw) as Record<string, unknown>;

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

type AuthStatus = "loading" | "choosing" | "tos" | "ready";

export default function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);

  const [step, setStep] = useState<AppStep>("brief");
  const [brief, setBrief] = useState<SpeechBrief>(loadSavedBrief);
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  // On mount: resolve session, then check ToS acceptance before granting access
  useEffect(() => {
    // Clean up the ?auth=success query param Google appends after OAuth redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
    }

    getCurrentUser().then(async (user) => {
      if (user) {
        setCurrentUser(user);
        // Server already checked the current ToS version in /auth/me
        if (!user.tosStatus.accepted) {
          setAuthStatus("tos");
        } else {
          setAuthStatus("ready");
        }
        return;
      }

      // No active session — guest or first-time visitor
      if (!hasAuthChoice()) {
        setAuthStatus("choosing");
        return;
      }

      // Returning guest: check if they have accepted the current ToS version locally
      try {
        const { version } = await fetchTos();
        if (guestHasAcceptedVersion(version)) {
          setAuthStatus("ready");
        } else {
          setAuthStatus("tos");
        }
      } catch {
        // If the ToS fetch fails, let them through rather than hard-blocking the app
        setAuthStatus("ready");
      }
    });
  }, []);

  const historyStore = getHistoryStore(currentUser !== null);

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
      try {
        await historyStore.save(entry);
        await historyStore.saveAudio?.(entry.id, audio);
        setSavedEntryId(entry.id);
      } catch (saveErr) {
        console.warn("[handleAnalyze] History save failed:", saveErr);
        setSavedEntryId(null);
      }
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

  const handleSignedOut = () => {
    setCurrentUser(null);
    clearAuthChoice();
    setAuthStatus("choosing");
  };

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)] text-sm">
        Loading…
      </div>
    );
  }

  if (authStatus === "choosing") {
    return (
      <AuthChoiceScreen
        onGuestChosen={async () => {
          // New guest: check if they need to accept the ToS before entering
          try {
            const { version } = await fetchTos();
            if (guestHasAcceptedVersion(version)) {
              setAuthStatus("ready");
            } else {
              setAuthStatus("tos");
            }
          } catch {
            setAuthStatus("ready");
          }
        }}
      />
    );
  }

  if (authStatus === "tos") {
    return (
      <TosGateScreen
        isGuest={currentUser === null}
        onAccepted={() => setAuthStatus("ready")}
      />
    );
  }

  const isGuest = currentUser === null;

  return (
    <div className="flex min-h-screen flex-col">
      {isAnalyzing && <AnalyzingOverlay />}
      <Header
        user={currentUser}
        isGuest={isGuest}
        onHistoryClick={() => setStep("history")}
        onSignedOut={handleSignedOut}
      />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        {step !== "history" && <StepIndicator current={step} />}

        {step === "brief" && (
          <section>
            <h2 className="mb-1 text-2xl font-extrabold tracking-tight">Plan Your Speech</h2>
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
            <h2 className="mb-1 text-2xl font-extrabold tracking-tight">Practice</h2>
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
            <h2 className="mb-1 text-2xl font-extrabold tracking-tight">Your feedback</h2>
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
            historyStore={historyStore}
            isGuest={isGuest}
            onBack={() => setStep("brief")}
            onViewEntry={viewHistoryEntry}
            onSignIn={() => {
              // Redirect to Google — after auth the page reloads and session resolves
              window.location.href = `${import.meta.env.VITE_API_URL ?? ""}/auth/google`;
            }}
          />
        )}
      </main>
    </div>
  );
}
