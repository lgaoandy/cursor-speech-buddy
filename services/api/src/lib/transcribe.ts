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
  // Groq enforces a 25 MB limit on audio files
  const MAX_BYTES = 25 * 1024 * 1024;
  if (stat.size > MAX_BYTES) {
    throw new Error("Audio file exceeds the 25 MB limit.");
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
