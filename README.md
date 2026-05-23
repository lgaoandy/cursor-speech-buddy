# Speech Buddy

AI-assisted practice for public speaking, presentations, and communication — built for a hackathon MVP.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4
- **Backend (next step):** Separate API service for speech-to-text + LLM analysis

## Project structure

```
speech-buddy/
├── docs/
│   ├── HACKATHON.md      # Team plan & hour-by-hour guide
│   └── DEMO_SCRIPT.md    # 3-minute demo walkthrough
├── src/
│   ├── components/       # UI (form, record/upload, feedback)
│   ├── lib/              # Rubric, prompts, analyze client
│   └── types/            # Shared TypeScript types
├── index.html
└── vite.config.ts
```

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Without `VITE_API_URL`, **Analyze** returns demo feedback so you can build the UI first.

## Backend contract

`POST {VITE_API_URL}/analyze` — `multipart/form-data`:

| Field | Type |
|-------|------|
| `audio` | File (webm, mp3, etc.) |
| `brief` | JSON string (`SpeechBrief`) |
| `durationSeconds` | number |

Response: JSON matching `SpeechFeedback` in `src/types/speech.ts`.

Prompt templates live in `src/lib/prompts.ts` — copy them into your API service.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |

## Deploy

Static hosting works for the frontend (Vercel, Netlify, Cloudflare Pages). Point `VITE_API_URL` at your API at build time.
# cursor-speech-buddy
