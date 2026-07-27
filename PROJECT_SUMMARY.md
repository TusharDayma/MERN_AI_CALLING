# AntiTalk: Comprehensive Project Summary

AntiTalk is a cutting-edge B2B SaaS platform engineered to revolutionize the recruitment pipeline. By leveraging real-time, autonomous AI voice agents, AntiTalk automates initial candidate phone screenings, allowing HR departments to scale their hiring efforts exponentially while maintaining a high bar for technical evaluation.

---

## 💼 1. The Business Perspective (The "Why")

### The Problem
In modern enterprise recruitment, HR professionals spend hundreds of hours manually calling candidates for basic preliminary screenings. This process is highly inefficient, prone to unconscious human bias, difficult to scale during hiring surges, and results in delayed feedback for candidates.

### The AntiTalk Solution
AntiTalk deploys autonomous AI Interviewers that can dial hundreds of candidates simultaneously. The AI asks role-specific technical and behavioral questions, reacts intelligently in real-time, and objectively evaluates the conversation.
- **Massive Time Savings**: HR can launch a campaign of 500 candidates with a single CSV upload and a click of a button.
- **Standardized Evaluation**: Every candidate gets asked the same baseline questions in the same professional tone, reducing human bias.
- **Actionable Insights**: Instantly upon call completion, HR receives a quantified AI Score (0-100) and a parsed "Dossier" containing the candidate's strengths, weaknesses, and a full transcript.

---

## 🛠️ 2. The Technical Architecture (The "How")

AntiTalk is built on a distributed, highly-modular microservice architecture to ensure that the heavy computational load of Machine Learning does not block standard CRUD operations.

### Frontend Application (React)
- **Tech Stack**: React 18 (Vite), Tailwind CSS, Framer Motion, Lucide Icons.
- **Role**: Provides a stunning, "Dark Mode" Enterprise UI for two distinct user roles.
  - **Admin Portal**: For platform superusers to monitor system health, manage HR accounts, and enforce global settings (like concurrent call limits).
  - **HR Portal**: For recruiters to build campaigns, upload candidate CSVs, and view real-time ranking dashboards.

### Core Backend Service (Node.js)
- **Tech Stack**: Node.js, Express.js, Prisma ORM, SQLite, Twilio Node SDK.
- **Role**: Acts as the central nervous system. It handles JWT Authentication, Role-Based Access Control (RBAC), database persistence, and triggers outbound API calls to Twilio.

### AntiGravity AI Engine (Python)
- **Tech Stack**: Python 3, FastAPI, Uvicorn, WebSockets.
- **Machine Learning / Multi-Agent Pipeline**: 
  - **Agent 1: TTS (Text-to-Speech)**: `kokoro-onnx` (streams audio segments).
  - **Agent 2: STT (Speech-to-Text)**: `faster-whisper` (transcribes incoming candidate stream).
  - **Agent 3: Brain (LLM/Interview Agent)**: `ollama` (Llama 3). Acts as an autonomous technical interviewer. Evaluates candidate answers against the HR campaign's `key_criteria`. Performs stateful tracking of question index and attempts, politely re-asking once if answers are vague/incomplete, and enforces strict voice-only output (no markdown formatting, bold text, lists, or thoughts).
  - **Agent 4: Analyst (Ranker Agent)**: `ollama` (Llama 3). Performs post-call evaluation on the full transcript, extracting a structured dossier (`score`, `summary`, `strengths`, `weaknesses`) using strict JSON schemas and markdown cleaning.
- **Role**: A dedicated service that handles the raw, bi-directional 8kHz $\mu$-law audio streams coming from Twilio. It runs the STT $\rightarrow$ LLM $\rightarrow$ TTS loop in real-time, featuring "Barge-In" capabilities (detecting if the candidate interrupts the AI to stop audio playback).

---

## 🔄 3. The End-to-End Execution Flow (The Journey)

The lifecycle of an AntiTalk AI Screening campaign follows a strictly orchestrated 7-step pipeline:

### Step 1: Campaign Creation
The HR User logs into the React dashboard and uses the Campaign Wizard to define a job role (e.g., "Senior Node.js Developer"). They upload a CSV of candidates, which the frontend parses (`PapaParse`) and sends to the Node.js backend to save in the SQLite database.

### Step 2: Call Dispatch
The HR User clicks "Launch Campaign". The Node.js server iterates through the pending candidates and uses the Twilio REST API to initiate outbound phone calls (`twilioClient.calls.create`).

### Step 3: TwiML Handshake
When a candidate answers their phone, Twilio pings the Node.js server asking for instructions (via a Webhook). Node.js returns an XML document (TwiML) instructing Twilio to open a `<Stream>` to the Python FastAPI server, passing along the `candidateId`.

### Step 4: The Real-Time Interview
Twilio establishes a WebSocket connection with the Python Server (`/media-stream`). 
1. **Listen**: Twilio streams the candidate's raw audio to Python. The STT Agent (Agent 2) transcribes it.
2. **Evaluate & Re-ask**: The LLM Agent (Agent 3) parses the response, checks the specific `key_criteria` for the current question, and decides whether to transition to the next question or ask a polite follow-up (capping follow-ups at 1 per question to ensure smooth progression).
3. **Speak**: The TTS Agent (Agent 1) converts the clean, voice-formatted text back into raw audio and streams it to Twilio, which plays it into the candidate's ear.

### Step 5: Post-Call Analytics
The candidate hangs up, closing the WebSocket connection. The Python `RankerAgent` (Agent 4) immediately takes the full conversation transcript and prompts the LLM to generate a JSON dossier containing a summary, strengths, weaknesses, and a final score out of 100.

### Step 6: Webhook Synchronization
The Python service acts as a client, making an HTTP `POST` request to the Node.js server (`/api/webhooks/call-completed`) containing the candidate's ID, Score, and JSON Dossier. Node.js updates the SQLite database and marks the candidate as `COMPLETED`.

### Step 7: HR Review
The HR User refreshes their "Candidate Rankings" page in React. They instantly see the candidate's score on a progress bar. Clicking "View Dossier" opens a frosted-glass modal displaying the AI's technical summary and the raw interview transcript, allowing HR to make an immediate hiring decision.

---

## 🛠️ 4. Verification & Testing

To test and verify the multi-agent pipeline without spinning up Twilio or running external WebSockets, a CLI-based tester is provided:
*   **CLI Agent Tester (`test_agents.py`)**: Directly runs `LLMAgent` and `RankerAgent` in the terminal. Simulates TTS via console printing and STT via user input (`input()`). Offers both **Mock Mode** (deterministic state progression) and **Real Ollama Mode** (live model integration). Prints the fully compiled evaluation dossier upon completion.

---

## 🚀 5. How to Run the Full Pipeline

For full integration (web interface, backend, voice AI service, and Twilio calls), the project relies on the following runtime steps:

1. **Database Initialization**: Setup SQLite using Prisma:
   ```bash
   cd server && npx prisma db push && node seed.js
   ```
2. **Start Services**:
   - Run `npm run dev` in the root folder to start the React frontend and Node.js proxy server.
   - Run the Python server on port 8000:
     ```bash
     cd python_service && .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
     ```
3. **Establish Ngrok Tunnel**: Route public Twilio requests and WebSocket stream connections to the backend server:
   ```bash
   ngrok http --url=stonable-remiform-augustina.ngrok-free.dev 5000
   ```
   *(Since Node.js proxies all `/media-stream` traffic on Port 5000 to Port 8000, only a single ngrok tunnel is needed!)*
4. **Log In and Test**: Open the web application, log in with `hr@antitalk.com` / `password123`, create a campaign, and add candidates to receive live automated voice interviews.

