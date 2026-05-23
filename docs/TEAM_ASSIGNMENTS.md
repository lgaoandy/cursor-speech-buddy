# Speech Buddy — Team assignments & step-by-step plan

**Repo:** [github.com/lgaoandy/cursor-speech-buddy](https://github.com/lgaoandy/cursor-speech-buddy)  
**Time budget:** ~14 hours focused work  
**Tooling:** Cursor for implementation; GitHub for collaboration  

**Current status (shared):**

| Done | Not done |
|------|----------|
| Vite + React UI (brief → record/upload → feedback) | Real speech-to-text (STT) |
| Mock “Analyze” when `VITE_API_URL` is empty | LLM analysis API |
| Types, prompts, rubric in `src/` | `services/api/` backend |
| Docs + GitHub repo | Production deploy + live demo URL |
| Production build works locally | Demo rehearsed 3× with real API |

**How to use this doc:** Each person owns **one list**. Check boxes as you finish. When blocked, post in team chat with: what you tried, error message, and branch name.

**Recommended providers (decide in first 15 min together):**

- **STT (speech-to-text):** OpenAI Whisper API  
- **LLM (feedback):** OpenAI GPT (same API key)  

---

## List 1 — Full-stack developer

**Owns:** Backend API, frontend ↔ API integration, prompt tuning, fixing UI bugs found in QA.

**Goal by end of hackathon:** Clicking **Analyze speech** calls your real API and returns a full `SpeechFeedback` object (not mock data).

---

### 1.1 Environment setup (30 min)

- [ ] Clone repo and install frontend:
  ```bash
  git clone https://github.com/lgaoandy/cursor-speech-buddy.git
  cd cursor-speech-buddy
  git pull origin main
  npm install
  cp .env.example .env
  ```
- [ ] Confirm mock flow works:
  ```bash
  npm run dev
  ```
  Open http://localhost:5173 → fill brief → record/upload → **Analyze** → see demo feedback.
- [ ] Create a feature branch:
  ```bash
  git checkout -b feature/backend-api
  ```

**Cursor prompt example:**

> Create a new folder `services/api` with an Express (or Fastify) TypeScript server on port 3001. Add a health route `GET /health` and README section for how to run it. Do not put API keys in the frontend.

---

### 1.2 Scaffold the API service (1–1.5 h)

- [ ] Create `services/api/` with:
  - `package.json` (express, cors, multer, openai, dotenv, typescript)
  - `src/index.ts` — server entry
  - `src/routes/analyze.ts` — `POST /analyze`
  - `src/lib/transcribe.ts` — Whisper call
  - `src/lib/evaluate.ts` — LLM call + JSON parsing
  - `src/lib/fillers.ts` — copy regex logic from `src/lib/toastmasters.ts` (`FILLER_PATTERNS`)
  - `.env.example` with `OPENAI_API_KEY`, `PORT=3001`
- [ ] Enable CORS for `http://localhost:5173` (and later the production frontend URL from List 2).
- [ ] `GET /health` returns `{ "ok": true }`.

**Cursor prompt example:**

> Implement `POST /analyze` in `services/api` accepting multipart form fields: `audio` (file), `brief` (JSON string), `durationSeconds` (number). Return JSON matching `SpeechFeedback` in `src/types/speech.ts`. Copy prompt helpers from `src/lib/prompts.ts`.

**Contract (must match frontend):**

| Field | Type |
|-------|------|
| `audio` | File (webm, mp3, wav) |
| `brief` | JSON string → `SpeechBrief` |
| `durationSeconds` | number |

Response: `SpeechFeedback` (see `src/types/speech.ts`).

---

### 1.3 Speech-to-text — Whisper (1 h)

- [ ] In `transcribe.ts`, send uploaded audio to OpenAI Whisper (`whisper-1`).
- [ ] Return plain transcript string.
- [ ] Handle errors: empty file, file too large (>25MB Whisper limit), API failure → `500` with clear message.

**Cursor prompt example:**

> Add OpenAI Whisper transcription in `services/api/src/lib/transcribe.ts`. Accept a Buffer or temp file from multer. Return transcript text. Use OPENAI_API_KEY from env.

**Manual test:**

```bash
cd services/api
npm install
cp .env.example .env
# Add real OPENAI_API_KEY to .env
npm run dev
```

Use curl or Postman to POST a small `.mp3` to `/analyze` with dummy `brief` JSON — confirm transcript in response (even if LLM part is stubbed).

---

### 1.4 LLM evaluation — structured JSON (1.5–2 h)

- [ ] Copy/adapt `buildAnalysisSystemPrompt` and `buildAnalysisUserPrompt` from `src/lib/prompts.ts`.
- [ ] Call OpenAI Chat Completions with **JSON response** (or strict schema) so output maps to `SpeechFeedback`.
- [ ] Compute **before** LLM call (in code, not LLM):
  - `timing` from `durationSeconds` and `brief.timeLimitMinutes`
  - `fillers.count` and `fillers.examples` using same regex as frontend
- [ ] LLM fills: `content`, `delivery`, `language`, `takeawayAlignment`, `overallSummary`, and refines narrative parts of transcript feedback.
- [ ] Validate response shape; if JSON parse fails, retry once or return safe error.

**Cursor prompt example:**

> In `evaluate.ts`, call GPT-4o-mini with system prompt from `src/lib/prompts.ts` and user payload containing brief, transcript, durationSeconds, fillerCount. Parse response into SpeechFeedback. Merge in timing and filler metrics from code.

**Checklist for a good prompt:**

- Mention Toastmasters categories (content, delivery, language).
- Require scores 1–5 per category.
- Require assessment of all 3 takeaways in `brief.takeaways`.
- Respect `brief.watchFor` checkboxes.
- Keep feedback constructive and specific (quote transcript snippets).

---

### 1.5 Wire frontend to real API (30 min)

- [ ] In project root `.env`:
  ```
  VITE_API_URL=http://localhost:3001
  ```
- [ ] Restart `npm run dev` (Vite only reads env at start).
- [ ] Run API on 3001 and test full flow in browser.
- [ ] Improve error display if `analyze.ts` throws (message already shown in UI — verify it’s readable).

**Cursor prompt example:**

> Review `src/lib/analyze.ts` and ensure errors from the API surface in the Practice step. No changes unless the response shape doesn't match SpeechFeedback.

---

### 1.6 Polish & handoff to cloud (30 min)

- [ ] Add `services/api/README.md` with run instructions and env vars.
- [ ] Add root `package.json` script optional: `"dev:api": "npm --prefix services/api run dev"` (optional convenience).
- [ ] Commit and push branch; open PR to `main`:
  ```bash
  git add services/api src
  git commit -m "Add analyze API with Whisper STT and GPT feedback"
  git push -u origin feature/backend-api
  ```
- [ ] Notify **List 2** with: local API URL, env var names, and PR link.

**Definition of done (List 1):**

- [ ] Local end-to-end: record 30–60s speech → real transcript → real feedback JSON  
- [ ] No API keys in `src/` or committed `.env` files  

---

## List 2 — Cloud / networking

**Owns:** API keys & secrets, hosting, CORS, environment variables, production URLs, basic monitoring/uptime for demo.

**Goal by end of hackathon:** Public frontend URL + public API URL; teammates can use the deployed app without running locally.

---

### 2.1 Accounts & API keys (30 min)

- [ ] Create or use team OpenAI account: https://platform.openai.com/
- [ ] Generate **API key** with usage limits if possible (hackathon budget cap).
- [ ] Store key in team password manager — **never** commit to Git.
- [ ] Share key securely with List 1 only for local `.env` (or set directly in host dashboard).

**Cursor prompt example (documentation only):**

> Add a section to README.md "Deployment" listing required env vars: OPENAI_API_KEY, PORT, ALLOWED_ORIGINS, VITE_API_URL. Do not include actual secrets.

---

### 2.2 Local verification with developer (30 min)

- [ ] Pull latest `main` (or List 1’s branch after merge).
- [ ] Confirm API health:
  ```bash
  curl http://localhost:3001/health
  ```
- [ ] Confirm CORS: browser on `localhost:5173` can POST to API without CORS errors (DevTools → Network tab).

**If CORS fails — Cursor prompt:**

> Update services/api CORS config to allow origins from env ALLOWED_ORIGINS (comma-separated). Include http://localhost:5173 and our production frontend URL.

---

### 2.3 Deploy the API (1.5–2 h)

Pick **one** host (simplest first):

| Option | Notes |
|--------|--------|
| [Render](https://render.com/) | Free web service, easy env vars |
| [Railway](https://railway.app/) | Fast deploy from GitHub |
| [Fly.io](https://fly.io/) | Good if team knows it |

**Steps (generic):**

- [ ] Connect GitHub repo to host; set root directory to `services/api` (or deploy Dockerfile if added).
- [ ] Set environment variables on host:
  - `OPENAI_API_KEY` = (secret)
  - `PORT` = (host may inject, e.g. 10000)
  - `ALLOWED_ORIGINS` = `https://YOUR-FRONTEND-DOMAIN` (add localhost for testing if needed)
- [ ] Deploy; note public URL e.g. `https://speech-buddy-api.onrender.com`
- [ ] Verify:
  ```bash
  curl https://YOUR-API-URL/health
  ```

**Cursor prompt example:**

> Add a Dockerfile or render.yaml for services/api to deploy on Render as a web service. Expose PORT from env. Document deploy steps in services/api/README.md.

---

### 2.4 Deploy the frontend (1 h)

Pick **one** static host:

| Option | Notes |
|--------|--------|
| [Vercel](https://vercel.com/) | Import repo, framework Vite |
| [Netlify](https://www.netlify.com/) | Build: `npm run build`, publish `dist` |
| [Cloudflare Pages](https://pages.cloudflare.com/) | Same build command |

**Steps:**

- [ ] Connect repo; build command: `npm run build`; output directory: `dist`
- [ ] Set **build-time** env var:
  - `VITE_API_URL` = `https://YOUR-API-URL` (no trailing slash)
- [ ] Deploy; save public URL e.g. `https://cursor-speech-buddy.vercel.app`
- [ ] Update API `ALLOWED_ORIGINS` to include this exact frontend URL; redeploy API if needed.

**Cursor prompt example:**

> Add vercel.json or netlify.toml for Vite SPA: build npm run build, output dist, rewrite all routes to index.html for client-side routing.

---

### 2.5 Production smoke test (30 min)

- [ ] Open production frontend on phone + laptop.
- [ ] Full flow: brief → record → analyze → feedback loads.
- [ ] If failure: check API logs, CORS, `VITE_API_URL` typo, OpenAI quota.

**Document in README (Cursor):**

> Add "Production URLs" section: Frontend: ___, API: ___. Add teammate setup: clone, npm install, cp .env.example — only needed for local dev.

---

### 2.6 Access & demo stability (30 min)

- [ ] Confirm GitHub collaborators have **Write** access (Settings → Collaborators).
- [ ] Optional: add branch protection on `main` (require PR) if team wants safer merges.
- [ ] Optional: Uptime — bookmark health URL; keep API awake before demo (free tiers may sleep).

**Handoff to List 3:** Send production URLs + “demo brief” field values that work well.

**Definition of done (List 2):**

- [ ] Production frontend + API URLs in README  
- [ ] CORS works from production frontend  
- [ ] API key only on server, never in client bundle  

---

## List 3 — Junior / IT (QA, content, demo)

**Owns:** Test plan execution, sample speeches, copy/rubric review, demo rehearsal, bug reports, slides/README clarity for judges.

**Goal by end of hackathon:** Confident 3-minute demo; documented test cases; all critical bugs filed or fixed.

---

### 3.1 Local setup (30 min)

- [ ] Clone and run app (follow README):
  ```bash
  git clone https://github.com/lgaoandy/cursor-speech-buddy.git
  cd cursor-speech-buddy
  npm install
  cp .env.example .env
  npm run dev
  ```
- [ ] Walk through all 3 steps without skipping fields.
- [ ] Read `docs/DEMO_SCRIPT.md` and `docs/HACKATHON.md` once.

**Cursor prompt example (learning):**

> Explain what each file in src/components does in simple terms for a README "Architecture for teammates" section.

---

### 3.2 Test recordings & sample briefs (1 h)

Create **3 practice scenarios** (save audio files in `docs/samples/` only if small & team agrees — otherwise keep locally):

| # | Scenario | Title | Time limit | Purpose |
|---|----------|-------|------------|---------|
| A | Good short speech | Q3 roadmap update | 2 min | Happy-path demo |
| B | Many fillers | Team standup | 1 min | Test filler count |
| C | Over time limit | Long introduction | 1 min limit, record 90s | Test timing warning |

For each scenario, write a filled-in brief (3 takeaways) in `docs/TEST_BRIEFS.md`.

**Cursor prompt example:**

> Create docs/TEST_BRIEFS.md with three complete SpeechBrief examples (JSON or bullet lists) matching our form fields for demo and QA.

- [ ] Record scenarios A, B, C on your phone or laptop mic.
- [ ] Export as `.webm` or `.mp3` for backup upload during demo.

---

### 3.3 QA test pass — mock mode (1 h)

While API is not ready (`VITE_API_URL` empty):

- [ ] Form validation: cannot continue without title, description, all 3 takeaways.
- [ ] All speech formats in dropdown work.
- [ ] Watch-for checkboxes toggle correctly.
- [ ] Recording start/stop works (Chrome recommended).
- [ ] Upload audio works.
- [ ] Analyze shows demo feedback (placeholder transcript text is OK).
- [ ] Feedback page: all sections visible (timing, fillers, 3 categories, takeaways, transcript).
- [ ] **Practice again** returns to practice step with same brief.
- [ ] **New speech brief** resets form.

**Log bugs in GitHub Issues** (or shared doc) with format:

```
Title: [Brief/Practice/Feedback] short description
Steps: 1. 2. 3.
Expected:
Actual:
Browser:
```

**Cursor prompt example (for dev to fix):**

> Paste bug: Steps to reproduce… Fix in RecordOrUpload.tsx (or relevant file).

---

### 3.4 QA test pass — production (1 h)

After List 2 deploys URLs:

- [ ] Run scenarios A, B, C on **production** URL.
- [ ] Transcript matches what was spoken (roughly).
- [ ] Feedback mentions your 3 takeaways by topic.
- [ ] Timing card matches recording length.
- [ ] Filler count seems reasonable for scenario B.
- [ ] Test on **mobile browser** (mic permission flow).
- [ ] Test **upload backup file** if live mic fails.

- [ ] File issues for anything **demo-breaking** only (ignore minor styling).

---

### 3.5 Demo preparation (1–1.5 h)

- [ ] Update `docs/DEMO_SCRIPT.md` with:
  - Production URL
  - Exact brief text you will type (or pre-decide values)
  - Which scenario (A/B) you will record live
  - Backup: “I will upload `scenario-a.mp3` if mic fails”
- [ ] Rehearse demo **3 times**; time with phone timer (target ≤ 3 min).
- [ ] Assign speaking parts if presenting as a team:
  - Intro + problem (30s)
  - Live demo (2 min)
  - Tech stack + next steps (30s)

**Cursor prompt example:**

> Improve docs/DEMO_SCRIPT.md with a table for production URL, pre-filled form values, and a contingency checklist.

---

### 3.6 Rubric & copy review (30 min)

- [ ] Read labels in `src/lib/toastmasters.ts` and form UI — fix awkward wording via PR or ask List 1.
- [ ] Confirm Toastmasters categories on feedback page make sense to a non-expert.
- [ ] Suggest 1–2 judge-friendly sentences: what problem we solve, why AI helps.

**Cursor prompt example:**

> Review SpeechBriefForm and FeedbackReport copy for clarity. Suggest minimal text changes for a hackathon judge audience.

---

### 3.7 Final demo day checklist (30 min)

- [ ] Production URLs open on presentation machine.
- [ ] Logged into GitHub / hosting dashboards (List 2).
- [ ] API not cold-asleep (hit `/health` 2 min before presenting).
- [ ] Browser: mic permission allowed; tab not muted.
- [ ] Backup audio file on desktop.
- [ ] Optional: 1-slide pitch (problem → solution → stack → live demo).

**Definition of done (List 3):**

- [ ] `docs/TEST_BRIEFS.md` exists with 3 scenarios  
- [ ] `docs/DEMO_SCRIPT.md` updated with production URLs and rehearsed 3×  
- [ ] Critical bugs filed; demo path works on production  

---

## Coordination timeline (all three)

| When | Who | What |
|------|-----|------|
| **Hour 0** | All | Agree STT + LLM = OpenAI; assign branches; swap phone numbers |
| **Hours 1–4** | List 1 | API scaffold + Whisper |
| **Hours 1–2** | List 2 | API keys + CORS ready for localhost |
| **Hours 1–3** | List 3 | Mock QA + test briefs + recordings |
| **Hours 4–6** | List 1 | LLM + frontend wire-up; PR to main |
| **Hours 5–8** | List 2 | Deploy API + frontend |
| **Hours 7–9** | List 3 | Production QA + demo script update |
| **Hours 9–10** | All | Merge PRs, fix demo blockers only |
| **Hours 10–12** | List 3 | Rehearse demo 3×; List 2 monitors uptime |
| **Buffer** | All | Slides, stretch features only if stable |

---

## Shared definitions

| Term | Meaning |
|------|---------|
| **STT** | Speech-to-text — audio → transcript (Whisper) |
| **LLM** | Large language model — transcript + brief → feedback JSON (GPT) |
| **Mock mode** | No `VITE_API_URL` → frontend shows placeholder feedback |
| **MVP done** | Production URL, real analyze, demo rehearsed |

---

## Quick links in repo

| File | Purpose |
|------|---------|
| `src/types/speech.ts` | Data shapes API must return |
| `src/lib/prompts.ts` | LLM prompts for List 1 to reuse |
| `src/lib/analyze.ts` | Frontend API client |
| `src/lib/toastmasters.ts` | Rubric labels + filler regex |
| `docs/DEMO_SCRIPT.md` | Live presentation script |
| `docs/HACKATHON.md` | Short checklist (link here for detail) |

---

*Last updated: aligned with hackathon MVP scope. Check boxes in this file via PR or edit as tasks complete.*
