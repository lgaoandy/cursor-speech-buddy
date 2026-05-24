import fs from "fs";
import Groq, { toFile } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Sends a local audio file to Groq Whisper large-v3 and returns the transcript.
 * filePath is the multer temp path (no extension); originalName is the browser filename
 * (e.g. "practice.webm") so Groq can detect the audio format correctly.
 */
export async function transcribeAudio(
  filePath: string,
  originalName: string,
): Promise<string> {
  const stat = fs.statSync(filePath);
  // Groq's Whisper API enforces a hard 25 MB limit — files up to 50 MB are
  // accepted by our server but anything over 25 MB will fail here with a
  // clear message rather than a cryptic API error.
  const GROQ_MAX_BYTES = 25 * 1024 * 1024;
  if (stat.size > GROQ_MAX_BYTES) {
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
    throw new Error(
      `Audio file is ${sizeMB} MB — Groq Whisper's limit is 25 MB. ` +
        "Try compressing or trimming the recording before uploading.",
    );
  }

  // Wrap stream with the original filename so Groq knows the format (webm, mp3, etc.)
  const file = await toFile(fs.createReadStream(filePath), originalName);

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3",
    response_format: "text",
  });

  // groq-sdk returns a string when response_format is "text"
  const raw = (transcription as unknown as string).trim();
  if (!raw) {
    throw new Error("Whisper returned an empty transcript. Check audio quality.");
  }

  const cleaned = removeWhisperHallucinations(raw);
  if (!cleaned) {
    throw new Error(
      "No real speech was detected. Please record at least a few seconds of audio.",
    );
  }

  return cleaned;
}

/**
 * Whisper commonly hallucinates short filler phrases on silent or near-silent
 * audio. Strip these when they appear as the entire transcript or as a
 * trailing sentence that wasn't actually spoken.
 */
function removeWhisperHallucinations(text: string): string {
  // Phrases Whisper invents when there is little/no audio content
  const HALLUCINATIONS = [
    /^thank you\.?$/i,
    /^thank you for watching\.?$/i,
    /^thank you for listening\.?$/i,
    /^thanks for watching\.?$/i,
    /^thanks for listening\.?$/i,
    /^you\.?$/i,
    /^\[silence\]$/i,
    /^\[music\]$/i,
    /^\[applause\]$/i,
    /^\(silence\)$/i,
  ];

  // If the whole transcript is a hallucination, return empty string
  for (const pattern of HALLUCINATIONS) {
    if (pattern.test(text.trim())) return "";
  }

  // Strip a hallucinated trailing sentence (e.g. real speech + "\nThank you.")
  const trailingHallucinations = [
    /\s+thank you\.?$/i,
    /\s+thank you for watching\.?$/i,
    /\s+thank you for listening\.?$/i,
    /\s+thanks for watching\.?$/i,
    /\s+thanks for listening\.?$/i,
  ];

  let result = text;
  for (const pattern of trailingHallucinations) {
    result = result.replace(pattern, "");
  }

  return result.trim();
}
