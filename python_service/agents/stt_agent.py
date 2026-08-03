"""
agents/stt_agent.py
Speech-to-Text Agent — Groq Whisper API implementation.

Real mode: Writes raw PCM audio to a temporary WAV file and submits it to
           Groq's whisper-large-v3-turbo endpoint for ultra-low-latency transcription.

Mock mode: Returns deterministic pre-scripted candidate responses for rapid
           local development without any cloud API calls.
"""

import logging
import asyncio
import os
import wave
import tempfile
from config import USE_MOCK_AGENTS, GROQ_API_KEY, GROQ_STT_MODEL

logger = logging.getLogger(__name__)

# VAD/audio constants — match Exotel's 8kHz μ-law stream spec
PCM_SAMPLE_RATE = 8000
PCM_SAMPLE_WIDTH = 2    # 16-bit PCM (2 bytes)
PCM_CHANNELS = 1        # Mono


class STTAgent:
    """
    Converts raw PCM audio bytes → transcript text via Groq Whisper API.
    Implements the exact same public interface as the legacy faster-whisper agent
    so the orchestrator requires zero changes.
    """

    def __init__(self):
        self.is_mock = USE_MOCK_AGENTS
        self.call_count = 0
        self._groq_client = None

        if not self.is_mock:
            if not GROQ_API_KEY:
                logger.error(
                    "[STT Agent] GROQ_API_KEY is not set. "
                    "Set USE_MOCK_AGENTS=true or add GROQ_API_KEY to your .env."
                )
            else:
                try:
                    from groq import Groq
                    self._groq_client = Groq(api_key=GROQ_API_KEY)
                    logger.info(f"[STT Agent] Groq client initialised. Model: {GROQ_STT_MODEL}")
                except ImportError:
                    logger.error("[STT Agent] groq package not installed. Run: pip install groq")

    # ── Public Interface ──────────────────────────────────────────────────────

    async def process_audio(self, pcm_bytes: bytes) -> str:
        """
        Accepts raw 8kHz 16-bit mono PCM bytes and returns a transcript string.
        This is the primary entry point called by the interview orchestrator.
        """
        if self.is_mock or self._groq_client is None:
            return await self._mock_transcribe()

        return await asyncio.to_thread(self._transcribe_with_groq, pcm_bytes)

    # ── Private Helpers ───────────────────────────────────────────────────────

    async def _mock_transcribe(self) -> str:
        """Returns scripted candidate responses for local development."""
        await asyncio.sleep(0.4)
        self.call_count += 1

        mock_replies = {
            1: "Hi, yes I'm ready for the screening. Thank you for reaching out.",
            2: "I'm a full-stack developer with about 4 years of experience in React and Node.js.",
            3: "My current CTC is 14 lakhs. I'm targeting 18 to 20 lakhs for the next role.",
            4: "My notice period is 30 days, though I can negotiate an early release.",
            5: "Yes, I'm open to relocation. Currently based in Bangalore.",
            6: "I prefer a hybrid model — 2 to 3 days in office per week.",
            7: "Thank you very much. Looking forward to hearing from your team. Goodbye.",
        }

        reply = mock_replies.get(self.call_count, "I have strong experience and am actively seeking opportunities.")
        print(f"\033[93m[🎙️ STT AGENT] [MOCK] Transcript: \033[0m\"{reply}\"")
        return reply

    def _transcribe_with_groq(self, pcm_bytes: bytes) -> str:
        """
        Blocking function (runs in a thread via asyncio.to_thread):
          1. Writes PCM bytes to a temporary WAV file.
          2. Calls Groq's audio.transcriptions.create API.
          3. Returns the transcript text.
        """
        tmp_path = None
        try:
            # Write PCM to a temporary WAV so Groq can parse it
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp_path = tmp.name

            with wave.open(tmp_path, "wb") as wf:
                wf.setnchannels(PCM_CHANNELS)
                wf.setsampwidth(PCM_SAMPLE_WIDTH)
                wf.setframerate(PCM_SAMPLE_RATE)
                wf.writeframes(pcm_bytes)

            with open(tmp_path, "rb") as audio_file:
                transcription = self._groq_client.audio.transcriptions.create(
                    file=("audio.wav", audio_file, "audio/wav"),
                    model=GROQ_STT_MODEL,
                    response_format="text"
                )

            # Groq returns a plain string when response_format="text"
            text = transcription.strip() if isinstance(transcription, str) else str(transcription).strip()
            print(f"\033[93m[🎙️ STT AGENT] Groq transcript: \033[0m\"{text}\"")
            return text

        except Exception as e:
            logger.error(f"[STT Agent] Groq transcription failed: {e}", exc_info=True)
            return ""

        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass
