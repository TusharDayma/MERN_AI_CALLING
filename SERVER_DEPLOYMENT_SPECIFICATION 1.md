# AntiTalk Platform: Server Deployment & Specification Document

This document provides the complete, authoritative specification for hosting and deploying the **AntiTalk AI Voice Calling & Screening Platform** on a production server. 

It details all microservices, system-level dependencies, required network ports, software libraries, external API tools, environment variables, hardware sizing, and a complete **Ngrok-Free Deployment Architecture** using standard Linux reverse proxies (Nginx), TLS/SSL termination (Let's Encrypt), process management (PM2 & Systemd), and firewall rules.

---

## 🏢 1. System Architecture Overview

AntiTalk is built using a decoupled microservices architecture designed for real-time bi-directional audio streaming, automated AI phone screening, and live candidate tracking.

```mermaid
flowchart TD
    subgraph Public Internet
        RecruiterBrowser[Recruiter Web Dashboard<br/>React 18 / Vite]
        CandidatePhone[Candidate Mobile/Phone<br/>PSTN Call]
        ExotelCloud[Exotel Telephony Platform<br/>Outbound Calling & WhatsApp]
        GroqCloud[Groq Cloud API<br/>Whisper STT & LLaMA 3.3 70B]
        FishCloud[Fish Audio API<br/>S2.1 Pro TTS Optional]
    end

    subgraph Production Server Network Perimeter
        Firewall[Firewall / UFW<br/>Ports 80, 443 OPEN]
        Nginx[Nginx Reverse Proxy & SSL<br/>Let's Encrypt TLS Termination]
    end

    subgraph Internal Isolated Server Environment
        NodeBackend[Node.js Express Server<br/>127.0.0.1:5000<br/>REST API, Auth, Socket.IO]
        PythonEngine[Python FastAPI Engine<br/>127.0.0.1:8000<br/>VAD, Audio Stream, State Machine]
        SQLiteDB[(SQLite / PostgreSQL DB<br/>Local File or Port 5432)]
    end

    RecruiterBrowser -->|HTTPS / Port 443| Nginx
    RecruiterBrowser -->|WSS / Socket.IO| Nginx
    ExotelCloud -->|HTTPS Webhooks| Nginx
    ExotelCloud <-->|WSS Audio Stream /media-stream| Nginx
    CandidatePhone <-->|Voice Leg| ExotelCloud

    Nginx -->|Proxy /api| NodeBackend
    Nginx -->|Proxy /socket.io| NodeBackend
    Nginx -->|Proxy /media-stream| PythonEngine
    Nginx -->|Static Frontend Assets| RecruiterBrowser

    NodeBackend <-->|Prisma ORM| SQLiteDB
    PythonEngine -->|HTTP Post-Call Webhook| NodeBackend
    PythonEngine <-->|HTTPS API / STT & LLM| GroqCloud
    PythonEngine <-->|HTTPS API / TTS| FishCloud
```

### Component Responsibilities:
1. **Frontend (React 18 + Vite)**: Provides the Recruiter Dashboard, candidate management, campaign launch interface, candidate dossiers, and real-time call tracking.
2. **Backend API & Orchestration (Node.js Express + Prisma ORM)**: Manages authentication, campaigns, candidate records, SQLite/PostgreSQL database storage, Socket.IO live updates, Exotel telephony dispatch, and webhook processing.
3. **AI Voice Engine (Python FastAPI)**: Handles bi-directional 8kHz μ-law PCM audio streaming via WebSockets (`/media-stream`), Voice Activity Detection (VAD), Speech-to-Text (STT), LLM state machine, Text-to-Speech (TTS), and candidate evaluation scoring.

---

## 🔌 2. Network Ports & Protocols Specification

When hosting on a server, **ngrok is NOT allowed**. All traffic is routed securely through a public reverse proxy (Nginx or Caddy) listening on standard web ports (**80** and **443**). Internal microservice ports are strictly bound to `127.0.0.1` (localhost) for security.

### Port Allocation Matrix

| Service | Internal Port | Protocol | Binding Address | Publicly Exposed? | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Nginx Reverse Proxy** | `80` | HTTP / TCP | `0.0.0.0` | **YES** | ACME HTTP-01 Let's Encrypt validation & HTTP-to-HTTPS redirect. |
| **Nginx Reverse Proxy** | `443` | HTTPS / WSS | `0.0.0.0` | **YES** | Public endpoint for Web Dashboard, REST APIs, Webhooks, and Exotel Audio WSS. |
| **Node.js Express Server** | `5000` | HTTP / WS | `127.0.0.1` | **NO** | Internal REST API, Socket.IO handler, and Exotel webhook receiver. |
| **Python FastAPI Engine** | `8000` | HTTP / WS | `127.0.0.1` | **NO** | Internal AI Voice engine and WebSocket media stream handler (`/media-stream`). |
| **Agent Sandbox UI (Optional)** | `8005` | HTTP / WS | `127.0.0.1` | **NO** | Interactive voice testing sandbox (development/testing only). |
| **PostgreSQL Database (Optional)** | `5432` | TCP | `127.0.0.1` | **NO** | Recommended for high-concurrency production database scaling. |

> [!IMPORTANT]
> **Firewall Policy**: Only Ports **22 (SSH)**, **80 (HTTP)**, and **443 (HTTPS)** should be open in your cloud provider's firewall / AWS Security Group / UFW. Ports `5000`, `8000`, `8005`, and `5432` must remain strictly internal.

---

## 🛠️ 3. Complete Software & Library Dependency List

### 3.1 System-Level Requirements & Binaries

| Tool / Binary | Required Version | Purpose |
| :--- | :--- | :--- |
| **Linux OS** | Ubuntu 20.04 LTS / 22.04 LTS | Recommended server operating system. |
| **Node.js** | v18.x LTS or v20.x LTS | Runtime environment for Express backend & React build process. |
| **npm** | v9.x or higher | Node package manager. |
| **Python** | 3.10, 3.11, or 3.12 | Core runtime for FastAPI AI Voice Engine. |
| **pip** | 23.x or higher | Python package installer. |
| **ffmpeg / ffprobe** | 4.x or higher | **CRITICAL**: Required by `pydub` to decode, resample, and transcode audio formats (MP3, WAV, 8kHz μ-law PCM). |
| **Nginx** | 1.18.0 or higher | Production reverse proxy, static file server, TLS termination. |
| **Certbot** | Latest (Snap / apt) | Automated Let's Encrypt SSL certificate creation and auto-renewal. |
| **PM2** | Latest (`npm i -g pm2`) | Daemon process manager for Node.js backend. |
| **systemd** | Pre-installed on Ubuntu | Service daemon manager for Python Uvicorn AI service. |
| **Git** | 2.x or higher | Version control for deployment. |

---

### 3.2 Backend Dependencies (`server/package.json`)

#### Core Runtime Libraries:
- **`express` (`^5.2.1`)**: Fast, unopinionated web framework for Node.js REST API.
- **`@prisma/client` (`^6.19.3`) & `prisma` (`^6.19.3`)**: Type-safe database ORM and schema migration tool.
- **`socket.io` (`^4.8.3`)**: Real-time bi-directional WebSocket server for live candidate status tracking.
- **`http-proxy-middleware` (`^4.2.0`)**: WebSocket proxying for routing `/media-stream` connections to FastAPI.
- **`jsonwebtoken` (`^9.0.3`)**: Generation and verification of JWT access tokens for HR recruiters.
- **`bcrypt` (`^6.0.0`)**: Password hashing algorithm for authentication security.
- **`cors` (`^2.8.6`)**: Cross-Origin Resource Sharing middleware.
- **`dotenv` (`^17.4.2`)**: Environment variable configuration manager.
- **`express-rate-limit` (`^8.6.2`)**: Rate limiting to prevent brute-force attacks on auth and campaign launch endpoints.
- **`helmet` (`^8.3.0`)**: Security header customization middleware.
- **`libphonenumber-js` (`^1.13.10`)**: Phone number validation and standardized E.164 formatting.
- **`node-fetch` (`^3.3.2`)**: HTTP client for outbound Exotel Telephony REST API calls.
- **`twilio` (`^6.0.2`)**: Optional Twilio integration SDK.
- **`zod` (`^4.4.3`)**: Runtime TypeScript-first schema validation library.
- **`nodemon` (`^3.1.14`)**: Development process reloader.

---

### 3.3 AI Voice Engine Dependencies (`python_service/requirements.txt`)

#### Core Python Packages:
- **`fastapi` (`0.111.0`)**: Modern, high-performance ASGI web framework for building APIs and WebSockets.
- **`uvicorn` (`0.30.1`)**: Production-grade ASGI server implementation for running FastAPI.
- **`websockets` (`12.0`)**: High-speed bi-directional WebSocket client and server library for handling Exotel audio frames.
- **`python-dotenv` (`1.0.1`)**: Loads environment variables from `.env` file into `os.environ`.
- **`requests` (`2.32.3`)**: HTTP library used for internal webhook dispatching to Node backend.
- **`groq` (`>=0.9.0`)**: Official Groq Cloud SDK for ultra-low latency Speech-to-Text (`whisper-large-v3-turbo`) and LLM Brain (`llama-3.3-70b-versatile`).
- **`edge-tts`**: Free Microsoft Edge Neural Text-to-Speech library (zero cost, zero API key required fallback).
- **`pydub`**: High-level audio manipulation library for converting audio streams into Exotel-compliant 8kHz 8-bit μ-law PCM formats (requires system `ffmpeg`).

---

### 3.4 Frontend Dependencies (`client/package.json`)

#### React UI & State Libraries:
- **`react` (`^19.2.7`) & `react-dom` (`^19.2.7`)**: UI rendering engine.
- **`react-router-dom` (`^7.18.1`)**: Client-side routing engine.
- **`axios` (`^1.18.1`)**: HTTP client for talking to Node backend REST APIs.
- **`socket.io-client` (`^4.8.3`)**: WebSocket client receiving live call events.
- **`framer-motion` (`^12.42.2`)**: Production-ready animation library.
- **`lucide-react` (`^1.26.0`)**: Clean, customizable icon set.
- **`recharts` (`^3.10.1`)**: Data visualization library for campaign analytics.
- **`papaparse` (`^5.5.4`)**: CSV file parser for bulk candidate upload.
- **`country-state-city` (`^3.2.1`)**: Country, state, and city phone code / location selection.
- **`dompurify` (`^3.4.13`)**: XSS sanitization for candidate evaluation dossiers.
- **`clsx` (`^2.1.1`) & `tailwind-merge` (`^3.6.0`)**: Dynamic CSS utility class merger.
- **`tailwindcss` (`^4.3.3`) & `@tailwindcss/vite` (`^4.3.3`)**: Utility-first CSS framework.
- **`vite` (`^8.1.1`)**: High-speed bundler and static site generator.

---

## 🌐 4. External Services & Accessing Tool Names

The platform interacts with the following external SaaS platforms and APIs over HTTPS (Port 443):

| Tool / Service Name | Host Domain | Purpose | Required API Key |
| :--- | :--- | :--- | :--- |
| **Groq Cloud API** | `api.groq.com:443` | - Speech-to-Text: `whisper-large-v3-turbo`<br/>- Brain LLM: `llama-3.3-70b-versatile`<br/>- Ranker Analyst: `llama-3.3-70b-versatile` | **YES** (`GROQ_API_KEY`) |
| **Exotel Telephony Platform** | `api.exotel.com:443`<br/>`my.exotel.com:443` | - Initiating PSTN outbound calls<br/>- WhatsApp outbound messaging<br/>- Streaming call audio via WebSocket | **YES** (`EXOTEL_API_KEY`, `EXOTEL_API_TOKEN`, `EXOTEL_ACCOUNT_SID`) |
| **Fish Audio API (Optional)** | `api.fish.audio:443` | Premium Neural Text-to-Speech (`s2.1-pro-free`). | **OPTIONAL** (`FISH_AUDIO_API_KEY`) |
| **Edge TTS (Fallback)** | Microsoft Speech Endpoints | Automated zero-cost TTS fallback (`en-US-AvaNeural`). | **NO KEY REQUIRED** |

---

## 🔑 5. Complete Environment Variable Matrix

Replace all `your-ngrok-domain.ngrok-free.app` references with your actual server domain name (e.g. `calling.yourdomain.com`).

### 5.1 Node Backend Configuration (`server/.env`)

```env
# Server Binding
PORT=5000

# Database Connection (SQLite default, PostgreSQL for production scaling)
DATABASE_URL="file:./dev.db"
# For PostgreSQL: DATABASE_URL="postgresql://user:password@localhost:5432/antitalk_db?schema=public"

# Security & Authentication
JWT_SECRET="generate-a-strong-random-64-char-string-for-production"
INTERNAL_WEBHOOK_SECRET="generate-a-strong-secret-key-for-internal-webhooks"

# Exotel Telephony Credentials
EXOTEL_API_KEY="your_production_exotel_api_key"
EXOTEL_API_TOKEN="your_production_exotel_api_token"
EXOTEL_ACCOUNT_SID="your_production_exotel_account_sid"
EXOTEL_CALLER_ID="+91XXXXXXXXXX" # Verified Exotel Landline / Virtual Number

# Production Public Domain Webhooks (NO NGROK)
# Replaced with your real server domain pointing to Nginx SSL
BOT_WEBSOCKET_URL="wss://calling.yourdomain.com/media-stream"
STATUS_CALLBACK_URL="https://calling.yourdomain.com/api/telephony/leg/webhook"
```

---

### 5.2 Python AI Engine Configuration (`python_service/.env`)

```env
# Server Binding
PORT=8000

# Agent Mode Toggle (false = Real Cloud APIs, true = Local Mocks)
USE_MOCK_AGENTS=false

# Groq Cloud API Settings
GROQ_API_KEY="gsk_your_groq_cloud_production_api_key"
GROQ_STT_MODEL="whisper-large-v3-turbo"
GROQ_LLM_MODEL="llama-3.3-70b-versatile"
GROQ_RANKER_MODEL="llama-3.3-70b-versatile"

# Audio Pipeline Specification (Exotel Standards)
EXOTEL_SAMPLE_RATE=8000
EXOTEL_CHANNELS=1

# Internal Destination Webhook (Communicates within Server localhost)
EXPRESS_WEBHOOK_URL="http://127.0.0.1:5000/api/webhooks/call-completed"
EXPRESS_WEBHOOK_SECRET="generate-a-strong-secret-key-for-internal-webhooks"

# Fish Audio TTS (Optional — Leave blank to default to Edge TTS)
FISH_AUDIO_API_KEY="sk-fish-your-optional-key"
FISH_AUDIO_MODEL="s2.1-pro-free"
FISH_AUDIO_VOICE_ID="7f92f8afb8ec43bf81429cc1c9199cb1"

# System Prompt Customization
AI_SYSTEM_PROMPT="You are a professional AI Recruiter evaluating candidates technically and concisely."
```

---

## 💻 6. Production Server Hardware Sizing & Specifications

Because Speech-to-Text, LLM Inference, and Text-to-Speech execution are offloaded to **Groq Cloud**, the local server hardware requirements are very light. 

### Hardware Sizing Matrix

| Concurrency Level | Target Call Capacity | Recommended VPS Tier | vCPU | RAM | Storage | Est. Monthly Cost |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Small / Standard** | 1 - 5 concurrent calls | DigitalOcean Basic / AWS t3.small | 2 vCPUs | 2 GB | 25 GB SSD | ~$12 - $15 / mo |
| **Medium / Growth** | 5 - 25 concurrent calls | DigitalOcean General / AWS t3.medium | 4 vCPUs | 8 GB | 50 GB SSD | ~$40 - $50 / mo |
| **Enterprise** | 25 - 100 concurrent calls | AWS c6i.xlarge + Managed Postgres | 8 vCPUs | 16 GB | 100 GB NVMe | ~$120 / mo |

> [!IMPORTANT]
> **Data Center Regional Location**: Network latency is paramount for real-time voice conversations. Select a server data center physically located near your telephony provider (e.g., AWS `ap-south-1` Mumbai or DigitalOcean `BLR1` Bangalore for India Exotel calls).

---

## 🚀 7. Production Deployment without Ngrok (Step-by-Step Guide)

### Step 1: DNS & Firewall Setup
1. Point your domain's **A Record** to your server's Public IPv4 address:
   `calling.yourdomain.com  ->  203.0.113.50`
2. Enable UFW firewall on Ubuntu:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

---

### Step 2: System Dependencies & Tool Installation
Run on your Ubuntu server:
```bash
# Update System Packages
sudo apt update && sudo apt upgrade -y

# Install Core Tools, Node.js 20, Python 3.11, ffmpeg & Nginx
sudo apt install -y curl git build-essential ffmpeg nginx certbot python3-certbot-nginx python3-pip python3-venv

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 Process Manager globally
sudo npm install -g pm2
```

---

### Step 3: Clone Codebase & Install Project Packages
```bash
# Clone Repository into /var/www/
cd /var/www
git clone https://github.com/TusharDayma/MERN_AI_CALLING.git anti-talk
cd anti-talk

# Install Node Dependencies (Root, Client, Server)
npm install
npm install --prefix client
npm install --prefix server

# Build Frontend Production Static Bundle
npm run build --prefix client

# Set up Python Virtual Environment & Dependencies
cd python_service
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
cd ..
```

---

### Step 4: Configure Database & Environment Files
1. Create `server/.env` and `python_service/.env` as defined in **Section 5**.
2. Run database migrations and seed data:
   ```bash
   cd server
   npx prisma db push
   node seed.js
   cd ..
   ```

---

### Step 5: Configure Nginx Reverse Proxy & SSL (No Ngrok)

Create Nginx site configuration file at `/etc/nginx/sites-available/antitalk`:

```nginx
server {
    server_name calling.yourdomain.com;

    # Maximum file upload size (for resume/CSV import)
    client_max_body_size 20M;

    # 1. React Frontend Static Production Build
    location / {
        root /var/www/anti-talk/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 2. Node.js Express REST API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. Socket.IO WebSockets Proxy (Live HR Dashboard Updates)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # 4. Exotel Audio Streaming WebSocket Proxy (/media-stream)
    location /media-stream {
        proxy_pass http://127.0.0.1:8000/media-stream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Audio WebSocket Keep-Alive Timeouts (crucial for long phone calls)
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

Enable site configuration & provision SSL certificate:
```bash
# Enable Nginx Site
sudo ln -s /etc/nginx/sites-available/antitalk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Provision Free HTTPS / WSS SSL Certificate via Let's Encrypt
sudo certbot --nginx -d calling.yourdomain.com
```

---

### Step 6: Configure PM2 for Node Backend

Create PM2 ecosystem file at `/var/www/anti-talk/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: "antitalk-backend",
      script: "server.js",
      cwd: "/var/www/anti-talk/server",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    }
  ]
};
```

Start Node process:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### Step 7: Configure Systemd Service for Python AI Engine

Create Systemd unit file at `/etc/systemd/system/antitalk-ai.service`:

```ini
[Unit]
Description=AntiTalk Python AI Voice Engine (FastAPI Uvicorn)
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/anti-talk/python_service
ExecStart=/var/www/anti-talk/python_service/venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=3
EnvironmentFile=/var/www/anti-talk/python_service/.env

[Install]
WantedBy=multi-user.target
```

Enable & start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable antitalk-ai
sudo systemctl start antitalk-ai
sudo systemctl status antitalk-ai
```

---

## 🔍 8. Verification & Healthcheck Protocols

After deployment completes, run the following verification steps on your server:

### 1. Verify Node Backend REST API
```bash
curl https://calling.yourdomain.com/api/health
# Expected Output: {"status":"ok","message":"AntiTalk Domain-Driven API is running"}
```

### 2. Verify Python AI Engine
```bash
curl http://127.0.0.1:8000/
# Expected Output: {"status":"online","service":"AntiTalk Modular Python AI Engine","websocket":"/media-stream"}
```

### 3. Verify WebSocket Proxy Security & TLS
```bash
# Verify HTTPS SSL certificate grade
curl -I https://calling.yourdomain.com
```

---

## 📑 9. Summary Table for Hosting Providers

| Requirement | Value / Specification |
| :--- | :--- |
| **Operating System** | Ubuntu 20.04 LTS / 22.04 LTS |
| **Runtimes Required** | Node.js v20.x, Python 3.11, ffmpeg |
| **Public Ports Required** | TCP 80, TCP 443 |
| **Internal Microservice Ports** | 5000 (Node.js), 8000 (Python FastAPI) |
| **Public Tunneling Tool** | **NGROK IS NOT ALLOWED**. Nginx reverse proxy + Certbot TLS SSL is used. |
| **Domain Requirement** | Public FQDN (Fully Qualified Domain Name) with A record pointing to public IPv4 |
| **Telephony Integration** | Exotel REST API & WebSocket Media Streams (`wss://calling.yourdomain.com/media-stream`) |
| **Cloud AI APIs Used** | Groq Cloud (`api.groq.com:443`), Fish Audio (`api.fish.audio:443`) |
