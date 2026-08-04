"""
config.py — AntiTalk Python Service Configuration
Root-level config, imported directly by all agents as `from config import ...`
"""
import os
from dotenv import load_dotenv

# Ensure .env is loaded from the python_service directory regardless of execution cwd
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

PORT = int(os.getenv("PORT", 8000))
USE_MOCK_AGENTS = os.getenv("USE_MOCK_AGENTS", "true").lower() == "true"
EXPRESS_WEBHOOK_URL = os.getenv("EXPRESS_WEBHOOK_URL", "http://localhost:5000/api/webhooks/call-completed")

# ─────────────────────────────────────────────────────────────────────────────
# LLM Provider Selection: 'groq' (default) or 'huggingface'
# ─────────────────────────────────────────────────────────────────────────────
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()

# ─────────────────────────────────────────────────────────────────────────────
# Groq Cloud API — used for STT (Whisper) always; LLM/Ranker if LLM_PROVIDER=groq
# ─────────────────────────────────────────────────────────────────────────────
GROQ_API_KEY      = os.getenv("GROQ_API_KEY", "")
GROQ_STT_MODEL    = os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")
GROQ_LLM_MODEL    = os.getenv("GROQ_LLM_MODEL", "llama-3.3-70b-versatile")
GROQ_RANKER_MODEL = os.getenv("GROQ_RANKER_MODEL", "llama-3.3-70b-versatile")

# ─────────────────────────────────────────────────────────────────────────────
# Hugging Face Inference API — used for LLM/Ranker if LLM_PROVIDER=huggingface
# Get your free key at: https://huggingface.co/settings/tokens
# ─────────────────────────────────────────────────────────────────────────────
HF_API_KEY        = os.getenv("HF_API_KEY", "")
HF_LLM_MODEL      = os.getenv("HF_LLM_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")
HF_RANKER_MODEL   = os.getenv("HF_RANKER_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")

# ─────────────────────────────────────────────────────────────────────────────
# Exotel Audio Specs
# AgentStream uses 8kHz μ-law PCM (same as Twilio Media Streams)
# ─────────────────────────────────────────────────────────────────────────────
EXOTEL_SAMPLE_RATE = int(os.getenv("EXOTEL_SAMPLE_RATE", 8000))
EXOTEL_CHANNELS    = int(os.getenv("EXOTEL_CHANNELS", 1))

# ─────────────────────────────────────────────────────────────────────────────
# ─────────────────────────────────────────────────────────────────────────────
# Fish Audio S2.1 Pro TTS API Configuration
# Get your free key at: https://fish.audio/app/developers/
# ─────────────────────────────────────────────────────────────────────────────
FISH_AUDIO_API_KEY  = os.getenv("FISH_AUDIO_API_KEY", "")
FISH_AUDIO_MODEL    = os.getenv("FISH_AUDIO_MODEL", "s2.1-pro-free")
FISH_AUDIO_VOICE_ID = os.getenv("FISH_AUDIO_VOICE_ID", "7f92f8afb8ec43bf81429cc1c9199cb1")

# Legacy aliases — kept for backward compatibility with mock/test code
# ─────────────────────────────────────────────────────────────────────────────
STT_MODEL      = GROQ_STT_MODEL
WHISPER_MODEL  = GROQ_STT_MODEL
BRAIN_MODEL    = GROQ_LLM_MODEL
RANKER_MODEL   = GROQ_RANKER_MODEL
OLLAMA_MODEL   = GROQ_LLM_MODEL        # alias so old references don't break
TTS_MODEL      = os.getenv("TTS_MODEL", "fish_audio")

# Legacy audio aliases to prevent test suite errors
TWILIO_SAMPLE_RATE = EXOTEL_SAMPLE_RATE
TWILIO_CHANNELS    = EXOTEL_CHANNELS

AI_SYSTEM_PROMPT = os.getenv(
    "AI_SYSTEM_PROMPT",
    "You are a professional AI Recruiter. Keep responses concise and evaluate candidates technically."
)

