# AntiTalk - Enterprise AI Voice Calling SaaS

AntiTalk is a full-stack, enterprise-grade B2B SaaS platform that allows HR departments to automate initial candidate screening using AI Voice Agents. HR professionals can upload a roster of candidates, launch automated AI calling campaigns, and receive AI-generated scores and detailed dossiers for each candidate, dramatically accelerating the hiring pipeline.

## 🚀 Features

### 🛡️ Admin Portal (Superuser Control)
- **Global Dashboard**: Monitor system-wide metrics including total HR accounts, active AI interviews, average system latency, and estimated cost savings.
- **HR User Management**: View, manually create, block, unblock, or delete HR user accounts across organizations.
- **Platform Settings**: Configure global application state, including Maintenance Mode, Max Concurrent Twilio streams, and Candidate Data Retention policies.
- **Support Ticketing**: Dedicated view to handle and resolve password reset requests from HR users.

### 👔 HR Portal (Recruiters & Hiring Managers)
- **Campaign Wizard**: A polished, 4-step interactive flow to launch AI voice campaigns. Includes client-side PapaParse CSV handling to bulk upload hundreds of candidates instantly.
- **Campaign Management**: A high-level overview table to monitor active, paused, draft, and completed campaigns. Features one-click Start/Pause toggles.
- **Live Candidate Roster**: Click on any campaign to view a detailed modal displaying real-time AI screening statuses and scores.
- **Candidate Rankings**: A sortable, searchable data table displaying all candidates who have completed their AI interviews. Features a "Dossier Modal" that renders the raw transcript payload returned by the Python AI engine.
- **Job Role Management**: Define and manage re-usable job titles, departments, and descriptions.

### 🧠 AntiGravity Python Voice AI Engine
- **Real-Time Bi-Directional Streaming**: Integrates seamlessly with Twilio via FastAPI WebSockets (`/media-stream`), capturing 8kHz $\mu$-law chunks.
- **Barge-In Capabilities**: Detects candidate speech and interrupts active text-to-speech rendering on-the-fly.
- **Machine Learning Agents**: Modular architecture wrapping Speech-to-Text (`faster-whisper`), LLM dialog generation (`llama3` via Ollama), Text-to-Speech (`kokoro-onnx`), and post-call analytics (`RankerAgent`).
- **Mock Mode for Local Testing**: Safely run and test the complete WebSocket pipeline locally without requiring a dedicated GPU or multi-gigabyte AI model downloads by setting `USE_MOCK_AGENTS=true`.

### 🔒 Security & Architecture
- **JWT & Role-Based Access Control (RBAC)**: All sensitive routes and API endpoints are strictly protected by standard JWT verification and role middlewares (`HR` vs `ADMIN`).
- **Monorepo Architecture**: Clean separation between a React `client/`, a Node.js `server/`, and a FastAPI `python_service/`.
- **Database**: Prisma ORM with an SQLite database (downgraded to Prisma 6 to allow pure `.env` file configuration without requiring Driver Adapters).

---

## 🛠️ Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS, Framer Motion, Lucide Icons, Axios.
- **Backend (Express)**: Node.js, Express.js, Prisma ORM, Twilio SDK, JWT, bcrypt.
- **Backend (AI Engine)**: Python 3, FastAPI, Uvicorn, WebSockets.
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
# On Windows (CMD):
.\venv\Scripts\activate.bat
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cd ..
```

### 2. Configure Express Server Environment (`server/.env`)
In the `server/` directory, create a `.env` file to handle database routing, JWT secrets, and Twilio configs:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="antitalk-secret-key-12345"

# Twilio Configuration
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Public Tunnels (Required for Twilio Webhooks & WS Stream to reach localhost)
EXPRESS_PUBLIC_URL="https://stonable-remiform-augustina.ngrok-free.dev"
NGROK_PYTHON_URL="wss://stonable-remiform-augustina.ngrok-free.dev/media-stream"
```
*(Note: If `TWILIO_ACCOUNT_SID` is missing or left as placeholder, the backend automatically performs a "Dry-Run" without crashing, simulating the call in console logs.)*

### 3. Configure Python AI Engine Environment (`python_service/.env`)
In the `python_service/` directory, create a `.env` file to control the AI models:
```env
PORT=8000
USE_MOCK_AGENTS=true

# Twilio Audio Specs
TWILIO_SAMPLE_RATE=8000
TWILIO_CHANNELS=1

# Backend Webhook Destination
EXPRESS_WEBHOOK_URL="http://localhost:5000/api/webhooks/call-completed"

# AI Model Configuration
STT_MODEL="tiny.en"
TTS_MODEL="pyttsx3"
BRAIN_MODEL="llama3"
RANKER_MODEL="llama3"
AI_SYSTEM_PROMPT="You are a professional AI Recruiter. Keep responses concise and evaluate candidates technically."
```

### 4. Initialize & Seed the Database
Generate the SQLite database (`dev.db`), push the schema, and seed the default accounts:
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

### Option B: Batch Launcher (Windows)
Double-click `run_all.bat` in the root folder.

### Option C: Manual Launch (Separate Terminals)
* **Terminal 1 (Vite Frontend & Express Backend)**:
  ```bash
  npm run dev
  ```
* **Terminal 2 (Python Voice AI Engine)**:
  ```bash
  cd python_service
  .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  ```
* **Terminal 3 (Ngrok Tunnel)**:
  ```bash
  ngrok http --url=stonable-remiform-augustina.ngrok-free.dev 5000
  ```

---

## 📞 6. Twilio Live Calling & Single-Tunnel Ngrok Configuration

- **Single Tunnel Proxy Architecture**: The Express server (Port `5000`) includes a WebSocket proxy for `/media-stream` routing requests to the Python FastAPI engine (Port `8000`). Therefore, **you only need to run ONE ngrok tunnel on Port 5000**.
- **Dry-Run Mode**: If `TWILIO_ACCOUNT_SID` in `server/.env` is left as placeholder, campaigns will simulate call dispatch in your terminal logs (`[Twilio Dry Run] Simulating AI call...`) so you can test the UI without active Twilio credits.
- **Live Call Mode**:
  1. Set your valid Twilio `Account SID`, `Auth Token`, and `Phone Number` in `server/.env`.
  2. Launch ngrok using your reserved domain: `ngrok http --url=stonable-remiform-augustina.ngrok-free.dev 5000`.
  3. Ensure `EXPRESS_PUBLIC_URL` matches your https ngrok URL and `NGROK_PYTHON_URL` matches your wss ngrok URL in `server/.env`.
  4. Ensure Ollama is running and Llama 3 model is pulled (if `USE_MOCK_AGENTS=false`):
     ```bash
     ollama run llama3
     ```
  5. Go to the dashboard, create a campaign, and add a candidate with your real phone number (`+1XXXYYYZZZZ`) to test!

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
When an HR user launches a campaign, Node.js tells Twilio to call the candidate. When the candidate picks up, Twilio asks the Node.js server for instructions via TwiML. Node.js instructs Twilio to open a WebSocket connection (`<Stream>`) to the **Python FastAPI Engine** via Ngrok. 

The Python engine handles the interview in real-time, pulling campaign-specific configurations and using Agent 3 (LLM Brain) to evaluate user responses against key criteria. Once the Twilio call drops, Agent 4 (Ranker Analyst) calculates an AI Score, bundles a dossier JSON, and `POST`s it directly to the Express server Webhook to update the UI rankings instantly.
