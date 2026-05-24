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
  const text = transcription as unknown as string;
  if (!text || text.trim().length === 0) {
    throw new Error("Whisper returned an empty transcript. Check audio quality.");
  }

  return text.trim();
}
