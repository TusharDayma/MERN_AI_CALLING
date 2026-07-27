import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 8000))
USE_MOCK_AGENTS = os.getenv("USE_MOCK_AGENTS", "true").lower() == "true"
EXPRESS_WEBHOOK_URL = os.getenv("EXPRESS_WEBHOOK_URL", "http://localhost:5000/api/webhooks/call-completed")
TWILIO_SAMPLE_RATE = int(os.getenv("TWILIO_SAMPLE_RATE", 8000))
TWILIO_CHANNELS = int(os.getenv("TWILIO_CHANNELS", 1))

# AI Model Configuration
STT_MODEL = os.getenv("STT_MODEL", os.getenv("WHISPER_MODEL", "tiny.en"))
WHISPER_MODEL = STT_MODEL
TTS_MODEL = os.getenv("TTS_MODEL", "kokoro-v0_19.onnx")
BRAIN_MODEL = os.getenv("BRAIN_MODEL", os.getenv("OLLAMA_MODEL", "llama3"))
OLLAMA_MODEL = BRAIN_MODEL
RANKER_MODEL = os.getenv("RANKER_MODEL", os.getenv("OLLAMA_MODEL", "llama3"))
AI_SYSTEM_PROMPT = os.getenv("AI_SYSTEM_PROMPT", "You are a professional AI Recruiter. Keep responses concise.")

