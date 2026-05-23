# Hackathon plan — Speech Buddy

**Team:** 1 full-stack dev · 1 cloud/networking · 1 IT (junior)  
**Time:** ~14 hours focused work  

**Detailed step-by-step tasks (3 lists):** see [TEAM_ASSIGNMENTS.md](./TEAM_ASSIGNMENTS.md)

## MVP checklist

- [x] Speech brief form (format, title, description, 3 takeaways, time limit, watch-for)
- [x] Record / upload audio in browser
- [x] Feedback report UI (Toastmasters categories, timing, fillers, takeaways)
- [ ] Backend: STT (Whisper / Deepgram) + LLM structured JSON
- [ ] Deploy frontend + API
- [ ] Demo script rehearsed 3×

## Roles

| Person | Owns |
|--------|------|
| Full-stack | `src/`, API integration, prompts |
| Cloud | Deploy, env vars, CORS, `VITE_API_URL` |
| Junior | Rubric copy, test recordings, `DEMO_SCRIPT.md`, QA |

## Suggested hours

1. **Align (1h)** — Pick STT + LLM providers; freeze MVP scope  
2. **Skeleton (2h)** — This repo; mock analyze works  
3. **Audio + API (3h)** — Real transcription endpoint  
4. **Intelligence (3h)** — LLM prompt + JSON schema  
5. **Polish (2h)** — Loading states, demo path, errors  
6. **Harden (2h)** — Deploy, rehearse demo  
7. **Buffer (1h)** — Slides or stretch (score export)

## Backend folder (optional)

Add `services/api/` as a small Express or Fastify app when ready — keep API keys off the client.
