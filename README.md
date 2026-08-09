# AntiTalk - Enterprise AI Voice Calling SaaS

AntiTalk is a full-stack, enterprise-grade B2B SaaS platform that allows HR departments to automate initial candidate screening using AI Voice Agents. HR professionals can upload a roster of candidates, launch automated AI calling campaigns, and receive AI-generated scores and detailed dossiers for each candidate, dramatically accelerating the hiring pipeline.

## 🚀 Features

### 🛡️ Admin Portal (Superuser Control)
- **Global Dashboard**: Monitor system-wide metrics including total HR accounts, active AI interviews, average system latency, and estimated cost savings.
- **HR User Management**: View, manually create, block, unblock, or delete HR user accounts across organizations.
- **Credit Management**: Manually adjust and allocate voice credits for HR users directly from the dashboard.
- **Platform Settings**: Configure global application state, including Maintenance Mode, Max Concurrent Exotel streams, and Candidate Data Retention policies.
- **Support Ticketing**: Dedicated view to handle and resolve password reset requests from HR users.

### 💳 Product-Led Growth (PLG) Billing System
- **Free Trial & Credits**: New users start with a free trial credit balance. The backend algorithm calculates call durations and deducts credits accordingly.
- **Automated Upsell Funnel**: Intelligent 402 (Insufficient Credits) error handling blocks campaign launches when credits run low, gracefully triggering an in-app Upsell Upgrade Modal.

### 👔 HR Portal (Recruiters & Hiring Managers)
- **Campaign Wizard**: A polished, 4-step interactive flow to launch AI voice campaigns. Includes client-side PapaParse CSV handling to bulk upload hundreds of candidates instantly.
- **Campaign Management**: A high-level overview table to monitor active, paused, draft, and completed campaigns. Features one-click Start/Pause toggles.
- **Live Candidate Roster**: Click on any campaign to view a detailed modal displaying real-time AI screening statuses and scores.
- **Candidate Rankings**: A sortable, searchable data table displaying all candidates who have completed their AI interviews. Features a beautiful **Interactive DossierViewer** that parses AI evaluations into chat transcripts, strengths, and weaknesses. Includes a **Human-in-the-Loop** manual score override allowing HR to correct the AI.
- **Job Role Management**: Define and manage re-usable job titles, departments, and descriptions. Supports full create, edit, and delete functionality with safe dependency tracking.

### 🧠 AntiGravity Python Voice AI Engine
- **Real-Time Bi-Directional Streaming**: Integrates seamlessly with Exotel via FastAPI WebSockets (`/media-stream`), capturing 8kHz $\mu$-law chunks.
- **Barge-In Capabilities**: Detects candidate speech and interrupts active text-to-speech rendering on-the-fly with VAD echo-cancellation logic.
- **High-Performance Architecture**: Processes STT and TTS conversions in-memory via `io.BytesIO` buffers and native `audioop`, eliminating disk I/O latency.
- **Cloud AI Processing**: Powered by Groq Cloud (Whisper-large-v3-turbo for STT, Llama-3.3-70b-versatile for LLM/Ranker) for ultra-fast <300ms reasoning.
- **Enterprise TTS Engine**: Integrates Fish Audio S2.1 Pro and Edge TTS neural synthesis with 8kHz 8-bit mulaw telephony encoding.
- **Lightweight Context Management**: Utilizes sliding-window context pruning to ensure token efficiency.
- **Mock Mode for Local Testing**: Safely run and test the complete WebSocket pipeline locally without requiring cloud API keys by setting `USE_MOCK_AGENTS=true`.

### 🔒 Security & Architecture
- **JWT & Role-Based Access Control (RBAC)**: All sensitive routes and API endpoints are strictly protected by standard JWT verification and role middlewares (`HR` vs `ADMIN`).
- **Monorepo Architecture**: Clean separation between a React `client/`, a Node.js `server/`, and a FastAPI `python_service/`.
- **Database**: Prisma ORM with an SQLite database.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS, Framer Motion, Lucide Icons, Axios.
- **Backend (Express)**: Node.js, Express.js, Prisma ORM, Zod (validation), Exotel API, JWT, bcrypt.
- **Backend (AI Engine)**: Python 3, FastAPI, Uvicorn, WebSockets, Groq SDK, Fish Audio API, Edge TTS.
- **Database**: SQLite.

---

## ⚙️ Local Development Setup

To run the complete AntiTalk platform locally, follow these steps:

### 1. Install Node & Python Dependencies
From the root directory, install all Node dependencies:
```bash
npm install
npm install --prefix client
npm install --prefix server
```
For Python dependencies, activate the virtual environment and install requirements:
```bash
cd python_service
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cd ..
```

### 2. Configure Express Server Environment (`server/.env`)
In the `server/` directory, create a `.env` file to handle database routing, JWT secrets, and Exotel configs:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="antitalk-secret-key-12345"

# Exotel Configuration
EXOTEL_API_KEY="your_exotel_api_key"
EXOTEL_API_TOKEN="your_exotel_api_token"
EXOTEL_ACCOUNT_SID="your_exotel_account_sid"
EXOTEL_CALLER_ID="+910000000000"

# Security
INTERNAL_WEBHOOK_SECRET="antitalk-internal-secret-12345"

# Public Tunnels (Required for Exotel Webhooks & WS Stream to reach localhost)
BOT_WEBSOCKET_URL="wss://your-ngrok-domain.ngrok-free.app/media-stream"
STATUS_CALLBACK_URL="https://your-ngrok-domain.ngrok-free.app/api/telephony/leg/webhook"
```

### 3. Configure Python AI Engine Environment (`python_service/.env`)
In the `python_service/` directory, create a `.env` file to control the AI models:
```env
PORT=8000
USE_MOCK_AGENTS=false

# Exotel Audio Specs
EXOTEL_SAMPLE_RATE=8000
EXOTEL_CHANNELS=1

# Backend Webhook Destination
EXPRESS_WEBHOOK_URL="http://localhost:5000/api/webhooks/call-completed"
EXPRESS_WEBHOOK_SECRET="antitalk-internal-secret-12345"

# AI Provider Configuration
GROQ_API_KEY="your_groq_api_key"
GROQ_LLM_MODEL="llama-3.3-70b-versatile"
GROQ_STT_MODEL="whisper-large-v3-turbo"
GROQ_RANKER_MODEL="llama-3.3-70b-versatile"

FISH_AUDIO_API_KEY="your_fish_audio_api_key"
```

### 4. Initialize & Seed the Database
```bash
cd server
npx prisma db push
node seed.js
cd ..
```

---

## 🚀 5. Running the Application

You can launch all services concurrently using one-click launchers, or start them manually.

### Option A: PowerShell Launcher (Recommended)
Open a PowerShell terminal and run:
```powershell
.\run_all.ps1
```

### Option B: Manual Launch (Separate Terminals)
* **Terminal 1 (Vite Frontend & Express Backend)**: `npm run dev`
* **Terminal 2 (Python Voice AI Engine)**: `cd python_service; .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
* **Terminal 3 (Ngrok Tunnel)**: `ngrok http --url=your-ngrok-domain.ngrok-free.app 5000`

---

## 📞 6. Exotel Live Calling & Single-Tunnel Ngrok Configuration

- **Single Tunnel Proxy Architecture**: The Express server (Port `5000`) includes a WebSocket proxy for `/media-stream` routing requests to the Python FastAPI engine (Port `8000`). Therefore, **you only need to run ONE ngrok tunnel on Port 5000**.
- **Live Call Mode**:
  1. Set your valid Exotel API keys in `server/.env`.
  2. Launch ngrok using your reserved domain.
  3. Ensure URLs in `server/.env` point to your ngrok domain.
  4. Configure your Groq API key in `python_service/.env`.

---

## 🔑 Test Credentials

Once you seed the database, you can log in using:

**HR Recruiter Account**
- **Email:** `hr@antitalk.com`
- **Password:** `password123`

**Admin Account**
- **Email:** `admin@antitalk.com`
- **Password:** `password123`

---

## 🔗 How the AI Bridge Works
When an HR user launches a campaign, Node.js tells Exotel to call the candidate. When the candidate picks up, Exotel connects to the WebSocket stream exposed by Node.js, which proxies it to the **Python FastAPI Engine**. 

The Python engine handles the interview in real-time using an in-memory streaming pipeline (Groq STT $\rightarrow$ Groq LLM Brain $\rightarrow$ Fish Audio TTS), evaluating user responses against key criteria. Once the call drops, Agent 4 (Ranker Analyst) calculates an AI Score, bundles a dossier JSON, and `POST`s it directly to the Express server Webhook to update the UI rankings instantly.
