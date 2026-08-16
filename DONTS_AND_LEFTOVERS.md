# AntiTalk: Don'ts and Leftover Work

This document provides a quick reference for constraints (Don'ts) and remaining tasks (Leftovers) for the AntiTalk Platform.

## 🚫 The Don'ts (Strict Constraints)

1. **Don't alter Audio Formats**: Exotel strictly requires `8kHz μ-law` format for bi-directional media streams. Changing the sample rate or encoding in the Python WebSocket server (`main.py`) or TTS Agent will break the telephony integration.
2. **Don't bypass the Node Proxy**: Always proxy WebSockets from Exotel through the Node.js backend to the Python FastAPI engine. Exposing Python directly to Exotel bypasses standard security/accounting layers.
3. **Don't push Raw Database Changes**: Never manually alter the SQLite database. Always use `npx prisma db push` or Prisma migrations to maintain schema integrity across environments.
4. **Don't leak AI API Keys**: Ensure `Groq` and `Fish Audio` API keys remain exclusively on the Python backend. Never send them to the React frontend or Node.js service.
5. **Don't exceed LLM Context on Re-asks**: The `LLMAgent` is capped at 1 re-ask per question to avoid hallucination loops and keep API latency low during live calls. Do not change this to an unbounded loop.

---

## 🛠️ Leftover Work (Pending Tasks)

1. **Exotel Sandbox Integration & E2E Testing**:
   - Complete end-to-end testing with real Exotel test numbers to verify latency and barge-in behavior under actual network conditions.
2. **Payment Gateway Integration (Stripe)**:
   - The PLG credit system logic is in place, but an actual payment processor needs to be hooked up to the Upsell Modals for buying more credits.
3. **Production Deployment & CI/CD**:
   - Containerize (Docker) the Node.js API, Python FastAPI service, and React Frontend.
   - Deploy to a scalable cloud provider (AWS/GCP), ensuring the WebSocket server can scale for high concurrency.
4. **Webhook Retry Mechanism**:
   - Add a retry queue for the `/api/webhooks/call-completed` webhook in case the Node server is temporarily down when Python finishes processing a dossier.
5. **Load Testing**:
   - Simulate 50+ concurrent candidate WebSocket streams to test the bounds of Groq Whisper/Llama API rate limits and Python async VAD performance.
6. **Error Handling on Call Drops**:
   - Implement graceful resumption or structured teardown if a candidate drops the cell phone call mid-interview.
