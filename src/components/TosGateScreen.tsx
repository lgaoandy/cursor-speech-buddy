import { useEffect, useRef, useState } from "react";
import { fetchTos, acceptTos, setGuestTosAcceptance } from "@/lib/tos";
import { signOut, clearAuthChoice } from "@/lib/auth";

interface TosGateScreenProps {
  isGuest: boolean;
  onAccepted: () => void;
}

type LoadState = "loading" | "ready" | "error";
type SubmitState = "idle" | "submitting" | "error";

export function TosGateScreen({ isGuest, onAccepted }: TosGateScreenProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [tosVersion, setTosVersion] = useState<string>("");
  const [tosContent, setTosContent] = useState<string>("");
  const [checked, setChecked] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTos()
      .then(({ version, content }) => {
        setTosVersion(version);
        setTosContent(content);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        console.error("[TosGateScreen] Failed to load ToS:", err);
        setLoadState("error");
      });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    clearAuthChoice();
    window.location.reload();
  };

  const handleAccept = async () => {
    if (!checked || submitState === "submitting") return;
    setSubmitState("submitting");
    setSubmitError(null);
    try {
      if (isGuest) {
        setGuestTosAcceptance(tosVersion);
      } else {
        await acceptTos();
      }
      onAccepted();
    } catch (err: unknown) {
      console.error("[TosGateScreen] Acceptance failed:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setSubmitState("error");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--foreground)]">
              Speech Buddy
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--muted)]">
              Human Intelligence Lab
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-[var(--muted)] underline underline-offset-2 hover:text-[var(--foreground)] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 gap-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Terms of Service
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Please read and accept our Terms of Service to continue.
          </p>
        </div>

        {/* Hackathon disclaimer */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">⚠ Hackathon Demonstration Document</span>
          <span className="ml-1">
            — This Terms of Service is a draft mock document created for demonstration purposes. It
            is not legally binding.
          </span>
        </div>

        {/* ToS content area */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--foreground)] leading-relaxed max-h-[50vh]"
        >
          {loadState === "loading" && (
            <p className="text-[var(--muted)]">Loading Terms of Service…</p>
          )}
          {loadState === "error" && (
            <p className="text-red-600">
              Failed to load Terms of Service. Please refresh the page and try again.
            </p>
          )}
          {loadState === "ready" && <TosMarkdown content={tosContent} />}
        </div>

        {/* Accept controls */}
        {loadState === "ready" && (
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">
                I have read and agree to the{" "}
                <span className="font-semibold">Terms of Service</span>
                {tosVersion ? ` (Version ${tosVersion})` : ""}
              </span>
            </label>

            {submitError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {submitError}
              </p>
            )}

            <button
              type="button"
              onClick={handleAccept}
              disabled={!checked || submitState === "submitting"}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitState === "submitting" ? "Recording acceptance…" : "I Agree — Continue"}
            </button>

            <p className="text-center text-xs text-[var(--muted)]">
              You cannot use Speech Buddy without accepting these terms.
              <br />
              To decline,{" "}
              <button
                type="button"
                onClick={handleSignOut}
                className="underline underline-offset-2 hover:text-[var(--foreground)] transition-colors"
              >
                sign out
              </button>
              .
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Renders the ToS markdown with minimal formatting.
 * We avoid a full markdown parser dependency — the ToS structure is predictable
 * and consistent, so simple line-by-line rules cover everything we need.
 */
function TosMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-xl font-bold text-[var(--foreground)] mt-4 first:mt-0">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-base font-bold text-[var(--foreground)] mt-4">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-sm font-semibold text-[var(--foreground)] mt-3">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-2 border-amber-400 pl-3 italic text-amber-700 text-xs"
            >
              {line.slice(2).replace(/^\*/, "").replace(/\*$/, "")}
            </blockquote>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <li key={i} className="ml-4 list-disc text-[var(--foreground)]">
              <InlineMarkdown text={line.slice(2)} />
            </li>
          );
        }
        if (line.startsWith("---")) {
          return <hr key={i} className="border-[var(--border)] my-3" />;
        }
        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }
        if (line.startsWith("*") && line.endsWith("*")) {
          return (
            <p key={i} className="italic text-[var(--muted)] text-xs">
              {line.slice(1, -1)}
            </p>
          );
        }
        return (
          <p key={i} className="text-[var(--foreground)]">
            <InlineMarkdown text={line} />
          </p>
        );
      })}
    </div>
  );
}

/** Handles inline **bold** formatting within a line of text. */
function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
