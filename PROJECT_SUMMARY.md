# AntiTalk Platform: Comprehensive Architecture & System Documentation

## Executive Summary & System Purpose

**AntiTalk** is an enterprise-grade multi-agent B2B SaaS platform engineered to revolutionize the recruitment pipeline. By leveraging real-time, autonomous AI voice agents over telephony streams, AntiTalk automates initial candidate phone screenings, allowing HR departments to scale their hiring efforts exponentially while maintaining a high bar for technical evaluation.

### Key Business Impact
- **Massive Scalability**: Recruiter launches campaigns for hundreds of candidates simultaneously with a single CSV upload.
- **Unbiased & Standardized Screenings**: Candidates receive identical technical evaluations and non-judgmental interactions.
- **Product-Led Growth (PLG) Ready**: Integrated credit billing system tracks usage limits and gracefully upsells HR users via an automated funnel when trial credits deplete.
- **Instant Quantitative & Qualitative Analytics**: HR receives an AI score (0–100), full interview transcripts, and parsed dossiers outlining candidate strengths and weaknesses immediately upon call termination.
- **Human-in-the-Loop QA**: HR maintains final authority with the ability to review interactive chat transcripts and manually override AI evaluations.

---

## 🏗️ System Architecture & Tech Stack

AntiTalk uses a 3-tier microservice architecture separating web management, business logic/telephony orchestration, and computationally heavy Machine Learning voice processing.

```mermaid
flowchart TB
    subgraph Frontend["Client Tier (React 18 + Vite)"]
        UI["Enterprise Dark-Mode Dashboard"]
        AdminUI["Admin Portal (User Management)"]
        HRUI["HR Portal (Campaigns & Rankings)"]
    end

    subgraph Backend["Core Node.js API Service"]
        API["Express REST API (Port 5000)"]
        Prisma["Prisma ORM"]
        DB[(SQLite Database)]
        ExotelSDK["Exotel REST SDK"]
    end

    subgraph Telephony["Telephony Network"]
        Exotel["Exotel Voice Gateway"]
    end

    subgraph AIEngine["Python AI Voice Engine"]
        FastAPI["FastAPI / WebSocket Server (Port 8000)"]
        STT["Agent 1: STT (Groq Whisper)"]
        LLM["Agent 2: LLM Brain (Groq Llama 3)"]
        TTS["Agent 3: TTS (Fish Audio S2.1)"]
        Ranker["Agent 4: Analyst (Groq Llama 3)"]
    end

    HRUI -->|REST API + JWT| API
    AdminUI -->|REST API + JWT| API
    API <--> Prisma <--> DB
    API -->|Outbound Call Trigger| ExotelSDK -->|SIP / Cellular Call| Exotel
    Exotel <-->|Bi-directional Audio WebSocket /media-stream| API
    API <-->|WebSocket Proxy| FastAPI
    FastAPI <--> STT
    FastAPI <--> LLM
    FastAPI <--> TTS
    FastAPI --> Ranker
    Ranker -->|HTTP POST /api/webhooks/call-completed| API
```

### Technology Stack Breakdown

| Layer | Stack / Technologies | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend Application** | React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion | Provides dark-mode management UI for Admin & HR portals, candidate CSV uploading, live rankings, Upsell funnels, and interactive dossier popups |
| **Backend Core** | Node.js, Express.js, Prisma ORM, SQLite, Zod | Auth (JWT), RBAC, campaign orchestration, input validation, DB persistence, Exotel call dispatch & webhooks, call billing (PLG credits algorithm) & accounting |
| **AI Engine Server** | Python 3.10+, FastAPI, Uvicorn, WebSockets | Streams bi-directional 8kHz $\mu$-law audio over WebSockets with Voice Activity Detection (VAD) and barge-in capability |
| **Speech-to-Text (STT)** | `Groq Whisper API` | Real-time transcription of incoming candidate voice audio |
| **LLM Brain & Analyst** | `Groq Llama 3 API` | Conversational interview state machine (evaluating criteria, handling re-asks) & post-call dossier analyst |
| **Text-to-Speech (TTS)** | `Fish Audio API` / `Edge TTS` | Low-latency synthesis of AI response text back into telephony-compatible audio streams |
| **Telephony Gateway** | Exotel Voice API | Connects cellular/landline phone networks with server WebSockets via custom call flow |

---

## 📊 Data Models & Schema Architecture

All application persistence is handled via Prisma ORM in `server/prisma/schema.prisma` backed by an SQLite database.

```mermaid
erDiagram
    User ||--o{ PasswordReset : requests
    User ||--o{ JobRole : creates
    User ||--o{ Campaign : manages
    JobRole ||--o{ Campaign : defines
    Campaign ||--o{ Question : contains
    Campaign ||--o{ Candidate : screens

    User {
        String id PK
        String name
        String username UK
        String email UK
        String password_hash
        Role role "ADMIN | HR"
        UserStatus status "ACTIVE | DEACTIVATED"
        Float total_voice_minutes
        Float credits_balance
        Float api_cost
        Boolean is_deleted
        DateTime created_at
        DateTime updated_at
    }

    PasswordReset {
        String id PK
        String user_id FK
        ResetStatus status "PENDING | RESOLVED"
        DateTime created_at
    }

    JobRole {
        String id PK
        String title
        String department
        String description
        String created_by FK
    }

    Campaign {
        String id PK
        String name
        String location
        String job_role_id FK
        String created_by_hr_id FK
        CampaignStatus status "DRAFT | ACTIVE | PAUSED | COMPLETED"
        DateTime created_at
    }

    Question {
        String id PK
        String campaign_id FK
        String text
        String type
        QuestionLevel level "EASY | MEDIUM | HARD"
        String key_criteria
        String expected_answer
    }

    Candidate {
        String id PK
        String campaign_id FK
        String name
        String email
        String contact
        String emp_details
        CandidateStatus status "PENDING | SCREENED | COMPLETED"
        Int ai_score
        String dossier_json
    }
```

---

## 🤖 Multi-Agent AI Engine Architecture

Located in `python_service/agents`, four specialized AI agents collaborate during and after the interview:

```
python_service/agents/
├── stt_agent.py              # Agent 1: Speech-to-Text (Groq Whisper)
├── llm_agent.py              # Agent 2: Conversation Manager & Brain (Groq Llama 3)
├── tts_agent.py              # Agent 3: Text-to-Speech (Fish Audio / Edge TTS)
└── ranker_agent.py           # Agent 4: Analyst & Dossier Generator (Groq Llama 3)
```

```mermaid
sequenceDiagram
    autonumber
    participant C as Candidate (Phone)
    participant T as Exotel Gateway
    participant Node as Node.js Proxy
    participant WS as FastAPI WebSocket
    participant STT as Agent 1: STT
    participant LLM as Agent 2: LLM Brain
    participant TTS as Agent 3: TTS
    participant Ranker as Agent 4: Analyst

    C->>T: Speaks into phone
    T->>Node: Streams 8kHz mulaw audio (WebSocket)
    Node->>WS: Proxies connection to Python backend
    WS->>STT: Accumulates audio until silence detected (VAD)
    STT-->>WS: Returns transcript ("I have 4 years of React experience")
    WS->>LLM: Pass candidate answer + question criteria
    LLM-->>WS: Returns clean speech text ("That's great. What is the Virtual DOM?")
    WS->>TTS: Synthesize AI text
    TTS-->>WS: Audio chunks (8kHz mulaw)
    WS->>Node: Proxies audio back
    Node->>T: Stream media payload
    T->>C: Plays AI audio to candidate

    Note over C,WS: Loop repeats until all campaign questions complete

    WS->>Ranker: Call disconnect -> Pass full transcript + job criteria
    Ranker-->>WS: Structured JSON Dossier (Score: 85, Strengths, Weaknesses)
    WS->>Node: POST /api/webhooks/call-completed (Candidate ID + Dossier)
```

---

## 🔄 End-to-End Execution Flow

```mermaid
flowchart LR
    Step1["1. Campaign Creation\n(HR uploads CSV)"] --> Step2["2. Call Dispatch\n(Node triggers Exotel REST)"]
    Step2 --> Step3["3. Media Stream\n(Exotel connects to WS)"]
    Step3 --> Step4["4. Interactive Interview\n(Bi-directional Voice Loop)"]
    Step4 --> Step5["5. Post-Call Analysis\n(Ranker Agent generates Dossier)"]
    Step5 --> Step6["6. Webhook Sync\n(Result posted to Node.js)"]
    Step6 --> Step7["7. HR Dashboard Review\n(Real-time scores & Dossiers)"]
```

---

## 📁 Core Directory & File Index

- **Database & Backend API**: `server/server.js`, `server/prisma/schema.prisma`, `server/controllers/` (`hrController.js`, `telephonyController.js`, `adminController.js`, `authController.js`)
- **Python AI Engine**: `python_service/main.py`, `python_service/agents/` (`stt_agent.py`, `llm_agent.py`, `tts_agent.py`, `ranker_agent.py`)
- **React Frontend**: `client/src/App.jsx`, `client/src/services/api.js`, `client/src/components/hr/HrDashboard.jsx`

---

## 🛠️ Setup & Execution Commands

1. **Database Setup**:
   ```bash
   cd server && npx prisma db push && node seed.js
   ```
2. **Start Dev Servers (Frontend + Node API)**:
   ```bash
   npm run dev
   ```
3. **Start Python AI Voice Engine**:
   ```bash
   cd python_service && .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
4. **Standalone Web Sandbox Test UI**:
   ```bash
   cd agent_test && .\..\python_service\venv\Scripts\python.exe -m uvicorn main:app --port 8005 --reload
   ```
