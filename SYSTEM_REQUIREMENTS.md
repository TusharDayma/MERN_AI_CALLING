# AntiTalk: Hardware & System Requirements

Because AntiTalk intelligently offloads the computationally heavy Machine Learning tasks (Speech-to-Text, LLM inference, and Text-to-Speech) to cloud providers like Groq and Fish Audio, the local hardware requirements to run the core orchestration servers are **extremely lightweight**. 

You do **not** need a local GPU to run this platform!

---

## 💻 Local Development Requirements (Minimum)
This is the minimum hardware required to run the React frontend, Node.js backend, and Python FastAPI engine simultaneously on your local machine for development and testing.

- **OS:** Windows 10/11, macOS (Intel or Apple Silicon), or Linux (Ubuntu 20.04+)
- **CPU:** Dual-core processor (Intel Core i3, AMD Ryzen 3, or Apple M1)
- **RAM:** 4 GB (8 GB recommended for smooth IDE + browser experience)
- **Storage:** ~1 GB of free space (for node_modules, Python venv, and SQLite db)
- **Network:** Standard broadband internet connection (crucial for low-latency WebSocket audio streaming and API calls to Groq).

---

## 🚀 Production Server Requirements
If you plan to deploy AntiTalk to a cloud provider (like AWS, DigitalOcean, or Render) to handle live concurrent Exotel phone calls, here are the recommended specs.

### 1. Node.js Express Server (Core API & Webhooks)
Handles JWT auth, Prisma/SQLite, and proxies WebSockets.
- **CPU:** 1 vCPU
- **RAM:** 1 GB - 2 GB
- **Storage:** 10 GB SSD
- *Example Tier:* DigitalOcean Basic Droplet ($6/mo) or AWS t3.micro

### 2. Python FastAPI Server (Voice Engine)
Handles the real-time bi-directional audio streams, Voice Activity Detection (VAD) algorithms, and API calls to Groq.
- **CPU:** 2 vCPUs (Recommended for handling multiple concurrent WebSocket streams)
- **RAM:** 2 GB - 4 GB (To handle in-memory `io.BytesIO` audio buffers)
- **Storage:** 10 GB SSD
- *Example Tier:* DigitalOcean Basic Droplet ($12/mo) or AWS t3.small

### 3. Database (Optional for Scaling)
Currently, the system uses SQLite which writes to a local file. For production scale (multiple server instances), you should migrate Prisma to use PostgreSQL.
- **CPU:** 1 vCPU
- **RAM:** 1 GB
- *Example Tier:* Managed PostgreSQL Database Base Tier ($15/mo)

---

## 🌐 Network Latency Considerations (Crucial)
Because this is a real-time voice AI, **network latency is more important than hardware specs**. 
- Your Python server should ideally be hosted in a cloud region physically close to the Exotel servers (e.g., AWS `ap-south-1` Mumbai) to minimize packet travel time.
- Groq's APIs are incredibly fast (often $<300ms$ turnaround time), so as long as your server has a stable, high-bandwidth connection, the AI will respond almost instantly!
