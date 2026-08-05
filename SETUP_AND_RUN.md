# 🚀 AntiTalk: Setup & Execution Guide

This document provides complete, step-by-step instructions to get the **AntiTalk** Enterprise AI Voice Calling platform running from scratch.

---

## 🏛️ System Architecture Summary

The project consists of three distinct microservices running on specific ports:

| Service | Technology | Port | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18 (Vite) | `5173` | Recruiter Dashboard & Campaign Creator. |
| **Backend** | Node.js (Express) | `5000` | REST API, SQLite database, & WebSocket reverse proxy. |
| **AI Voice Engine** | Python (FastAPI) | `8000` | Handles Exotel audio streams (STT → LLM → TTS). |
| **Ngrok Tunnel** | Ngrok Client | `5000` | Exposes your backend publicly so Exotel can connect. |

---

## 🔑 Default Credentials

After seeding the database, log in with:

| Role | Email | Password |
| :--- | :--- | :--- |
| **HR / Recruiter** | `hr@antitalk.com` | `password123` |
| **Super Admin** | `admin@antitalk.com` | `password123` |

---

## ⚙️ Phase 1: Environment & Dependency Setup

### 1. Install Project Dependencies

Run from the **root directory**:

```bash
# Install root + client + server Node dependencies
npm install
npm install --prefix client
npm install --prefix server

# Set up Python Virtual Environment
cd python_service

# Create the venv (first time only)
python -m venv venv

# Activate — Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Activate — Windows CMD:
.\venv\Scripts\activate.bat
# Activate — macOS / Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

cd ..
```

---

### 2. Configure Environment Files

#### Node Backend — `server/.env`

Copy the template and fill in your values:

```bash
cp server/.env.template server/.env
```

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="antitalk-secret-key-12345"

# Exotel Telephony Credentials
# Get from: https://my.exotel.com/exotel/account
EXOTEL_API_KEY="your_exotel_api_key"
EXOTEL_API_TOKEN="your_exotel_api_token"
EXOTEL_ACCOUNT_SID="your_exotel_account_sid"
EXOTEL_CALLER_ID="+910000000000"

# Public Webhook URLs (replace with your active Ngrok URL)
BOT_WEBSOCKET_URL="wss://your-ngrok-domain.ngrok-free.app/media-stream"
STATUS_CALLBACK_URL="https://your-ngrok-domain.ngrok-free.app/api/telephony/leg/webhook"
```

> [!NOTE]
> `BOT_WEBSOCKET_URL` and `STATUS_CALLBACK_URL` must point to your **live Ngrok URL**.
> The Express server proxies WebSocket traffic to Python automatically — you only need **one** Ngrok tunnel on port 5000.

---

#### Python AI Engine — `python_service/.env`

```env
PORT=8000

# Agent Mode Toggle
# USE_MOCK_AGENTS=true  → Fast local dev, no API calls required
# USE_MOCK_AGENTS=false → Real Groq cloud STT + LLM (default, recommended)
USE_MOCK_AGENTS=false

# Groq Cloud API — STT (Whisper), Brain LLM & Ranker
# Get your free key from: https://console.groq.com
GROQ_API_KEY="gsk_your_groq_api_key_here"
GROQ_STT_MODEL="whisper-large-v3-turbo"
GROQ_LLM_MODEL="llama-3.3-70b-versatile"
GROQ_RANKER_MODEL="llama-3.3-70b-versatile"

# Exotel Audio Specs (8kHz mu-law PCM)
EXOTEL_SAMPLE_RATE=8000
EXOTEL_CHANNELS=1

# Backend Webhook Destination
EXPRESS_WEBHOOK_URL="http://localhost:5000/api/webhooks/call-completed"

# Fish Audio S2.1 Pro TTS (optional — Edge TTS is the automatic fallback)
# Get your free key from: https://fish.audio/app/developers/
FISH_AUDIO_API_KEY="sk-fish-your_fish_audio_key_here"
FISH_AUDIO_MODEL="s2.1-pro-free"
FISH_AUDIO_VOICE_ID="7f92f8afb8ec43bf81429cc1c9199cb1"

# AI Behaviour
AI_SYSTEM_PROMPT="You are a professional AI Recruiter. Keep responses concise and evaluate candidates technically."
```

> [!IMPORTANT]
> **`GROQ_API_KEY`** is required for real STT, Brain LLM, and Ranker evaluation.
> **`FISH_AUDIO_API_KEY`** is optional. If absent, Edge TTS (`en-US-AvaNeural`) is used automatically — no key needed.

---

### 3. Initialize the SQLite Database

```bash
cd server
npx prisma db push
node seed.js
cd ..
```

---

## 🚀 Phase 2: Running the Services

### Option A — One-Click Launch (Recommended)

```powershell
# PowerShell:
.\run_all.ps1

# Windows Batch (double-click in Explorer):
run_all.bat
```

### Option B — Manual Terminals

**Terminal 1 — Node Backend + React Frontend:**
```bash
npm run dev
```

**Terminal 2 — Python AI Voice Engine:**
```bash
cd python_service
.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 — Ngrok Public Tunnel:**
```bash
ngrok http --url=your-ngrok-domain.ngrok-free.app 5000
```

---

## 📞 Phase 3: Verify Services Are Running

```bash
# Node backend
curl http://localhost:5000/api/health
# Expected: {"status":"ok","message":"AntiTalk API is running"}

# Python AI engine
curl http://localhost:8000/health
# Expected: {"status":"ok","service":"AntiTalk AI Engine"}
```

Or open your Ngrok URL: `https://your-ngrok-domain.ngrok-free.app/api/health`

---

## 🧪 Phase 4: Running All Tests

All test suites can be run **independently** — no Ngrok tunnel or Exotel account required unless stated.

---

### Test 1 — Agentic AI Pipeline Test *(Recommended · Real API Calls)*

**File:** `python_service/agentic_test.py`

The primary end-to-end test suite. Makes **real API calls** to Groq Whisper (STT), Groq LLaMA (Brain + Ranker), and Fish Audio / Edge TTS. Covers all 6 test agents with **70 automated checks**.

```bash
cd python_service

# Full real-API test (requires GROQ_API_KEY + FISH_AUDIO_API_KEY in .env)
.\venv\Scripts\python.exe agentic_test.py

# Mock-only mode — zero API calls, runs entirely locally
.\venv\Scripts\python.exe agentic_test.py --mock

# Run specific test agents only
.\venv\Scripts\python.exe agentic_test.py --suite config
.\venv\Scripts\python.exe agentic_test.py --suite stt
.\venv\Scripts\python.exe agentic_test.py --suite tts
.\venv\Scripts\python.exe agentic_test.py --suite brain
.\venv\Scripts\python.exe agentic_test.py --suite ranker
.\venv\Scripts\python.exe agentic_test.py --suite e2e
.\venv\Scripts\python.exe agentic_test.py --suite stt tts brain
```

**Coverage per agent:**

| Agent | What Is Tested |
| :--- | :--- |
| **Agent 1 · Config** | Port, webhook URLs, model string presence, API key detection, live Groq LLaMA ping |
| **Agent 2 · STT** | Mock mode (7 unique answers, call_count), real Groq Whisper with synthetic 8kHz PCM WAV |
| **Agent 3 · TTS** | Edge TTS direct (27 KB MP3), Fish Audio S2.1 Pro API (71 KB), full mu-law pipeline (160 chunks), whitespace guard |
| **Agent 4 · Brain LLM** | Mock state machine transitions, real Groq LLaMA conversation, JSON-leak detection in response |
| **Agent 5 · Ranker** | Mock dossier fields, real Groq LLaMA analyst (score 80/100 on test transcript) |
| **Agent 6 · E2E** | Full agentic loop STT → Brain → TTS → Ranker, 7 turns, score 82/100, elapsed 22.94s |

**Last verified:** `70 PASS · 1 WARN · 0 FAIL` — E2E score **82/100** in **22.94s**

---

### Test 2 — Legacy Mock-Only Unit Tests *(51 tests, no API keys needed)*

**File:** `python_service/run_tests.py`

Full mock pipeline: STT agent, LLM state transitions, Ranker dossier validation, webhook client fallback.

```bash
cd python_service
.\venv\Scripts\python.exe run_tests.py
```

---

### Test 3 — Automated Rule Verification *(4 conversation rules)*

**File:** `python_service/test_rules_automated.py`

Assertion-based tests for the four core conversation rules:

- **Rule 1 & 2:** WhatsApp outreach → candidate says Yes → scheduling link dispatched
- **Rule 3:** Scheduled voice call → greeting includes first question immediately
- **Rule 4 (Interested):** Fallback call → candidate accepts → transitions to screening questions
- **Rule 4 (Declined):** Fallback call → candidate declines → `candidate_status == "DECLINED"`, call ends

```bash
cd python_service
.\venv\Scripts\python.exe test_rules_automated.py
```

---

### Tests 4–7 — Agent Test Sandbox (`agent_test/`)

The `agent_test/` folder is a self-contained sandbox for running and verifying all AI agents directly — no Exotel, no Ngrok, no Express backend required.

> [!NOTE]
> All scripts in `agent_test/` use the **same Python venv** from `python_service/`. Always use `..\python_service\venv\Scripts\python.exe` to run them.

---

#### Test 4 — Component Smoke Test *(4 agents, quick pass/fail)*

**File:** `agent_test/test_components.py`

Runs LLM Brain, TTS, STT, and Ranker as sequential units, prints live sample outputs, and asserts core correctness. Uses `USE_MOCK_AGENTS` from `python_service/.env`.

```bash
cd agent_test
..\python_service\venv\Scripts\python.exe test_components.py
```

Expected output:
```
============================================================
  AntiTalk AI Voice Sandbox - Comprehensive Component Test
============================================================

[1/4] Testing LLM Brain Agent...
  [OK] Initial Greeting: "Hello Diagnostic User! Thank you for joining..."
  [OK] User Reply 1 -> LLM Response: "That's impressive, with 5 years..."

[2/4] Testing TTS Agent Voice Output...
  [OK] First Audio Payload Sample (b64): //////////////////////////////...
  [OK] Total TTS Audio Chunks Generated: 194

[3/4] Testing STT Agent Transcription...
  [OK] Transcribed Text: "Hi, yes I'm ready for the screening."

[4/4] Testing Ranker Agent Dossier Generation...
  [OK] Generated Candidate Score: 82/100
  [OK] Dossier Summary: The candidate presented themselves clearly...

  [SUCCESS] ALL COMPONENT TESTS PASSED PERFECTLY!
```

---

#### Test 5 — Agent Diagnostics *(LLM + TTS only, instant check)*

**File:** `agent_test/test_diag.py`

A lightweight diagnostic that initializes LLM and TTS agents, generates a greeting, and counts audio payload chunks. Fastest way to verify agents are healthy.

```bash
cd agent_test
..\python_service\venv\Scripts\python.exe test_diag.py
```

Expected output:
```
[Diag] Initializing LLM and TTS agents...
[Diag] Greeting: 'Hello Tester! Thank you for joining our ...'
[Diag] Payload #1: ////////////////////////////////////////...
[Diag] Total payloads generated: 800
```

---

#### Test 6 — Interactive Web Sandbox *(browser UI at localhost:8005)*

**Files:** `agent_test/main.py` + `agent_test/index.html`

Launches a FastAPI + WebSocket server at `http://localhost:8005` with a premium two-step browser UI.

**Step 1 — Configure your interview:**
- Enter your **name** and **role** (used in the AI greeting)
- Build a custom question list — **type any question and click ＋ Add**
- No predefined questions — everything is your own input
- The **Start Voice Interview** button stays disabled until you add at least one question

**Step 2 — Live voice session:**
- An animated orb shows real-time state: **🟢 speaking · 🔵 listening · 🟡 processing**
- A live **transcript log** shows timestamps, what you said, and what the AI said
- **Barge-in** is supported — start speaking while the AI is talking to interrupt it
- Click **End Interview** to close the session cleanly

**Run the server:**
```bash
cd agent_test
..\python_service\venv\Scripts\python.exe -m uvicorn main:app --port 8005 --reload
```

Open **[http://localhost:8005](http://localhost:8005)** in your browser.

> [!NOTE]
> The browser must grant **microphone permission** when prompted.
> The webhook post to `localhost:5000` will silently fail if Express is not running — this does **not** affect the voice call itself.
> Use `USE_MOCK_AGENTS=false` in `python_service/.env` for real Groq Whisper STT + Fish Audio TTS.

---

#### Test 7 — WebSocket Integration Test *(automated, requires web sandbox running)*

**File:** `agent_test/test_ws_server.py`

Automatically connects to the running sandbox server via WebSocket, sends a `start` event, and verifies that TTS audio chunks are streamed back. Requires the web sandbox (`main.py`) to be running in a separate terminal.

**Terminal 1 — Start the sandbox server:**
```bash
cd agent_test
..\python_service\venv\Scripts\python.exe -m uvicorn main:app --port 8005 --reload
```

**Terminal 2 — Run the WebSocket test:**
```bash
cd agent_test
..\python_service\venv\Scripts\python.exe test_ws_server.py
```

Expected output:
```
[+] Connecting to WebSocket server at ws://localhost:8005/media-stream?...
  [OK] WebSocket connection opened successfully!
  [OK] Sent 'start' event to server.
  [Server Log] Speaking: 'Hello Test User! Thank you for...'
  [OK] Received 219 TTS media audio chunks and 1 server log events.

  [SUCCESS] WebSocket Server integration test PASSED PERFECTLY!
```

---

### Test 8 — Interactive Agent Sandbox CLI *(fully configurable terminal session)*

**File:** `python_service/run_agent_sandbox.py`

A guided interactive CLI session. Configure:
- Candidate name, role, campaign brief, scheduling link
- Custom screening questions and evaluation criteria
- Channel type: WhatsApp / Voice Scheduled / Voice Fallback
- Agent mode: Mock or real Groq
- Drive each conversation turn manually
- Inspect TTS audio chunks and run Ranker post-call analysis

```bash
cd python_service
.\venv\Scripts\python.exe run_agent_sandbox.py
```

---

### Test 9 — Exotel Telephony API Integration Tests *(Node.js · requires live server)*

**File:** `server/run_telephony_api_tests.mjs`

Runs against the **live** Express backend at `localhost:5000`. Covers:
- HR authentication & JWT token issuance
- Candidate setup (uses existing or creates one dynamically)
- WhatsApp outbound dispatch route
- Exotel Leg / outbound dial route
- Inbound webhook simulation (WhatsApp opt-in message + call-answered event)

> [!IMPORTANT]
> The Express server **must be running** on `localhost:5000` before executing this test.

```bash
# Terminal 1 — start the backend first:
npm run dev

# Terminal 2 — run the telephony tests:
cd server
node run_telephony_api_tests.mjs
```

---

## 🔑 API Keys Reference

| Service | Purpose | Where to Get | Required? |
| :--- | :--- | :--- | :--- |
| **Groq** | STT (Whisper), Brain LLM, Ranker | [console.groq.com](https://console.groq.com) · Free tier | Yes, for real mode |
| **Fish Audio** | Primary TTS voice (S2.1 Pro) | [fish.audio/app/developers](https://fish.audio/app/developers/) · Free tier | No · Edge TTS fallback |
| **Exotel** | Outbound voice calls & WhatsApp | [my.exotel.com](https://my.exotel.com) · Paid | Yes, for real calls |
| **Ngrok** | Public HTTPS/WSS tunnel | [ngrok.com](https://ngrok.com) · Free static domain | Yes, for real calls |

---

## 🛠️ Phase 5: Troubleshooting

> [!WARNING]
> **ERR_NGROK_3200 — Endpoint is offline**
> - **Cause**: Ngrok tunnel client is not running or the static domain is not authenticated.
> - **Fix**: Run `ngrok http --url=your-domain.ngrok-free.app 5000` in Terminal 3. If you do not have a static domain, use `ngrok http 5000` for a temporary URL and update `BOT_WEBSOCKET_URL` and `STATUS_CALLBACK_URL` in `server/.env`.

> [!IMPORTANT]
> **Agentic tests fail with `GROQ_API_KEY` errors**
> - **Cause**: `python_service/.env` is missing or `GROQ_API_KEY` is empty / placeholder.
> - **Fix**: Add your real key from [console.groq.com](https://console.groq.com). For keyless local testing run: `python agentic_test.py --mock`.

> [!IMPORTANT]
> **TTS produces no audio / Fish Audio errors**
> - **Cause**: `FISH_AUDIO_API_KEY` is missing, invalid, or quota exceeded.
> - **Fix**: Edge TTS (`en-US-AvaNeural`) kicks in automatically at zero cost. Fish Audio is fully optional. Check / rotate your key at [fish.audio/app/developers](https://fish.audio/app/developers/).

> [!NOTE]
> **STT returns empty transcript for real audio**
> - **Cause**: Groq Whisper filters ambient noise and clips shorter than 100ms (< 1600 bytes at 8kHz 16-bit PCM).
> - **Fix**: Send audio chunks of at least 200ms. The agentic test uses a 2-second synthetic tone to confirm API reachability without a microphone.

> [!NOTE]
> **Why only one Ngrok tunnel on port 5000?**
> - The Express backend (`http-proxy-middleware`) catches incoming WebSocket connections at `https://<ngrok-domain>/media-stream` and forwards them to `ws://127.0.0.1:8000/media-stream` (the Python AI engine). No separate tunnel is needed for the Python service.

> [!NOTE]
> **`USE_MOCK_AGENTS` env change has no effect after Python starts**
> - **Cause**: `config.py` caches `USE_MOCK_AGENTS` as a module-level constant at import time.
> - **Fix**: The `agentic_test.py` suite handles this correctly by calling `importlib.reload(cfg_mod)` before reloading each agent module when switching between mock and real modes mid-run.
