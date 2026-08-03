import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 8000))
USE_MOCK_AGENTS = os.getenv("USE_MOCK_AGENTS", "true").lower() == "true"
EXPRESS_WEBHOOK_URL = os.getenv("EXPRESS_WEBHOOK_URL", "http://localhost:5000/api/webhooks/call-completed")

# ── Exotel Audio Specs ─────────────────────────────────────────────────────────
# Exotel AgentStream sends 8kHz μ-law PCM (same protocol as Twilio Media Streams)
EXOTEL_SAMPLE_RATE = int(os.getenv("EXOTEL_SAMPLE_RATE", 8000))
EXOTEL_CHANNELS = int(os.getenv("EXOTEL_CHANNELS", 1))

# ── Groq Cloud API ────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Groq STT: ultra-low-latency Whisper model
GROQ_STT_MODEL = os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")

# Groq LLM: Interview brain (high-capability, fast)
GROQ_LLM_MODEL = os.getenv("GROQ_LLM_MODEL", "llama-3.3-70b-versatile")

# Groq Ranker: Post-call analyst (same model, separate config for flexibility)
GROQ_RANKER_MODEL = os.getenv("GROQ_RANKER_MODEL", "llama-3.3-70b-versatile")

# ── Legacy aliases (kept for backward compat with mock/test code) ─────────────
STT_MODEL = GROQ_STT_MODEL
WHISPER_MODEL = GROQ_STT_MODEL
BRAIN_MODEL = GROQ_LLM_MODEL
RANKER_MODEL = GROQ_RANKER_MODEL

AI_SYSTEM_PROMPT = os.getenv("AI_SYSTEM_PROMPT", "You are a professional AI Recruiter. Keep responses concise.")
