# 🚀 AntiTalk: Setup & Execution Guide

This document provides complete, step-by-step instructions to get the **AntiTalk** Enterprise AI Voice Calling platform running from scratch. 

---

## 🏛️ System Architecture Summary

The project consists of three distinct microservices running on specific ports:

| Service | Technology | Port | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18 (Vite) | `5173` | Recruiter Dashboard & Campaign Creator. |
| **Backend** | Node.js (Express) | `5000` | REST API, SQLite database interface, & WebSocket reverse proxy. |
| **AI Voice Engine** | Python (FastAPI) | `8000` | Handles Twilio audio streams (STT $\rightarrow$ LLM $\rightarrow$ TTS). |
| **Ngrok Tunnel** | Ngrok Client | `5000` | Exposes your backend server publicly so Twilio can connect. |

---

## 🔑 Default Credentials

After seeding the database, you can use these credentials to log in:

| Role | Email | Password |
| :--- | :--- | :--- |
| **HR / Recruiter** | `hr@antitalk.com` | `password123` |
| **Super Admin** | `admin@antitalk.com` | `password123` |

---

## ⚙️ Phase 1: Environment & Dependency Setup

Before starting the application, ensure all project dependencies and configuration files are ready.

### 1. Install Project Dependencies
Run these commands from the root directory to install packages for the Frontend, Backend, and Python services:
```bash
# Install Node dependencies concurrently
npm install
npm install --prefix client
npm install --prefix server

# Set up Python Virtual Environment dependencies
cd python_service
# Activate the virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment Files

#### **Node Server config**: [server/.env](file:///d:/MERN_Agentic_calling/server/.env)
Create or verify the following configuration in your `server/.env` file:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="antitalk-secret-key-12345"

# Twilio Credentials (valid values or placeholder to trigger 'Dry Run')
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Public URLs (Replace with your actual active Ngrok URL)
EXPRESS_PUBLIC_URL="https://stonable-remiform-augustina.ngrok-free.dev"
NGROK_PYTHON_URL="wss://stonable-remiform-augustina.ngrok-free.dev/media-stream"
```

#### **Python AI config**: [python_service/.env](file:///d:/MERN_Agentic_calling/python_service/.env)
Create or verify the following configuration in your `python_service/.env` file:
```env
PORT=8000
USE_MOCK_AGENTS=true # Set to false to run real evaluation via local Ollama models

# Twilio Audio Specs
TWILIO_SAMPLE_RATE=8000
TWILIO_CHANNELS=1

# Backend Webhook Destination
EXPRESS_WEBHOOK_URL="http://localhost:5000/api/webhooks/call-completed"

# AI Model Configuration (Used if USE_MOCK_AGENTS=false)
STT_MODEL="tiny.en"
TTS_MODEL="pyttsx3"
BRAIN_MODEL="llama3"
RANKER_MODEL="llama3"
AI_SYSTEM_PROMPT="You are a professional AI Recruiter. Keep responses concise and evaluate candidates technically."
```

### 3. Initialize the SQLite Database
Run the Prisma migrations and the seed script to prepare the database:
```bash
cd server
npx prisma db push
node seed.js
cd ..
```

---

## 🚀 Phase 2: Running the Services

You can launch all parts of the application using a script or manually in individual terminal screens.

### Option A: One-Click Launch (Recommended)
You can use the launcher scripts in the root directory to open all servers:
* **PowerShell script**: Run [run_all.ps1](file:///d:/MERN_Agentic_calling/run_all.ps1) from your terminal.
* **Windows Batch script**: Double-click [run_all.bat](file:///d:/MERN_Agentic_calling/run_all.bat) in the file explorer.

### Option B: Manual Terminal Execution (Three Terminals)
Open three separate terminals in your IDE or system command prompt:

* **Terminal 1: Node Backend & React Frontend**
  ```bash
  npm run dev
  ```
* **Terminal 2: Python AI Service**
  ```bash
  cd python_service
  .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  ```
* **Terminal 3: Ngrok Public Tunnel**
  ```bash
  ngrok http --url=stonable-remiform-augustina.ngrok-free.dev 5000
  ```

---

## 📞 Phase 3: Testing & Twilio Integrations

Once all services are running, verify and interact with the application:

### 1. Test Endpoint Status
Navigate to the health check endpoint on your public URL in your browser:
👉 [https://stonable-remiform-augustina.ngrok-free.dev/api/health](https://stonable-remiform-augustina.ngrok-free.dev/api/health)

If the server and ngrok tunnel are functioning, it will return:
```json
{
  "status": "ok",
  "message": "AntiTalk API is running"
}
```

### 2. Standalone AI Agent Verification (CLI)
You can test the conversational state transitions and scoring algorithm inside your command prompt without dialing Twilio or launching the browser UI:
```bash
cd python_service
.\venv\Scripts\python.exe test_agents.py
```
* Enter `M` for Mock Agent simulation or `R` for real local Ollama (Llama 3) simulation, and converse via text inputs.

---

## 🛠️ Phase 4: Troubleshooting

> [!WARNING]
> **ERR_NGROK_3200 (Endpoint is offline)**
> - **Cause**: Your local ngrok tunnel client is not running or is not authenticated to use the domain `stonable-remiform-augustina.ngrok-free.dev`.
> - **Fix**: Ensure your Terminal 3 is active and executing `ngrok http --url=stonable-remiform-augustina.ngrok-free.dev 5000`. If you don't own this domain, just execute `ngrok http 5000` to get a free domain, and update `EXPRESS_PUBLIC_URL` and `NGROK_PYTHON_URL` in [server/.env](file:///d:/MERN_Agentic_calling/server/.env).

> [!IMPORTANT]
> **Real Ollama Model Evaluation is Slow / Fails**
> - **Cause**: If `USE_MOCK_AGENTS=false` is set in your python config, the backend will query your local Ollama instance.
> - **Fix**: Open a command prompt and type `ollama run llama3`. Make sure the model successfully downloads and responds to inputs. If your machine does not have a GPU, we strongly recommend keeping `USE_MOCK_AGENTS=true` for local development.

> [!NOTE]
> **Why do I only need one ngrok tunnel for Port 5000?**
> - The Express backend includes a proxy handler (`http-proxy-middleware`) that catches incoming WebSocket connections to `https://<ngrok-domain>/media-stream` and automatically upgrades and forwards them to the Python service running on `ws://127.0.0.1:8000/media-stream`. You do not need to run a separate ngrok tunnel for the Python server.
