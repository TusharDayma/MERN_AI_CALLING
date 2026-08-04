"""
agents/stt_agent.py
Speech-to-Text Agent — Groq Whisper API implementation with in-memory audio processing.
"""

import logging
import asyncio
import io
import wave
from config import USE_MOCK_AGENTS, GROQ_API_KEY, GROQ_STT_MODEL
from utils.audio_utils import resample_pcm8k_to_pcm16k

logger = logging.getLogger(__name__)

STT_SAMPLE_RATE = 16000
PCM_SAMPLE_WIDTH = 2    # 16-bit PCM
PCM_CHANNELS = 1        # Mono


class STTAgent:
    """
    Converts raw 8kHz PCM audio bytes -> 16kHz PCM -> transcript text via Groq Whisper API.
    Uses in-memory ByteIO buffers to eliminate disk I/O latency.
    """

    def __init__(self):
        self.is_mock = USE_MOCK_AGENTS
        self.call_count = 0
        self._groq_client = None

        if not self.is_mock:
            if not GROQ_API_KEY:
                logger.error("[STT Agent] GROQ_API_KEY is not set.")
            else:
                try:
                    from groq import Groq
                    self._groq_client = Groq(api_key=GROQ_API_KEY)
                    logger.info(f"[STT Agent] Groq client initialized. Model: {GROQ_STT_MODEL}")
                except ImportError:
                    logger.error("[STT Agent] groq package not installed.")

        # Common Whisper ambient noise hallucination phrases for instant filtering
        self._hallucination_phrases = {
            "subtitles by", "amara.org", "thank you for watching",
            "subscribe to", "i'll take the hand", "stop the shot at you",
            "like and subscribe", "bye bye", "mbc", "you", "thanks for watching"
        }

    async def process_audio(self, pcm_bytes: bytes) -> str:
        """Processes raw 8kHz 16-bit mono PCM bytes and returns transcript string."""
        if self.is_mock or self._groq_client is None:
            return await self._mock_transcribe()

        return await asyncio.to_thread(self._transcribe_with_groq, pcm_bytes)

    async def _mock_transcribe(self) -> str:
        """Returns scripted candidate responses for local development."""
        await asyncio.sleep(0.05)
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
        return mock_replies.get(self.call_count, "I have strong experience and am actively seeking opportunities.")

    def _transcribe_with_groq(self, pcm_bytes: bytes) -> str:
        """
        In-Memory Transcription:
          1. Resamples 8kHz PCM to 16kHz PCM.
          2. Writes WAV header + PCM frames into memory io.BytesIO.
          3. Submits directly to Groq Whisper API.
        """
        if len(pcm_bytes) < 1600:
            logger.info("[STT Agent] Audio chunk too short (<100ms). Skipping.")
            return ""

        try:
            pcm16k_bytes = resample_pcm8k_to_pcm16k(pcm_bytes)

            # Build in-memory WAV buffer
            wav_io = io.BytesIO()
            with wave.open(wav_io, "wb") as wf:
                wf.setnchannels(PCM_CHANNELS)
                wf.setsampwidth(PCM_SAMPLE_WIDTH)
                wf.setframerate(STT_SAMPLE_RATE)
                wf.writeframes(pcm16k_bytes)
            
            wav_bytes = wav_io.getvalue()
            wav_io.seek(0)
            wav_io.name = "audio.wav"

            transcription = self._groq_client.audio.transcriptions.create(
                file=("audio.wav", wav_bytes, "audio/wav"),
                model=GROQ_STT_MODEL,
                language="en",
                temperature=0.0,
                prompt="Candidate response to HR technical interview:",
                response_format="text"
            )

            text = transcription.strip() if isinstance(transcription, str) else str(transcription).strip()
            text_lower = text.lower().strip()

            # Filter ambient noise hallucinations
            if not text_lower or text_lower in self._hallucination_phrases or any(h in text_lower for h in list(self._hallucination_phrases)[:7]):
                logger.info(f"[STT Agent] Filtered noise hallucination: '{text}'")
                return ""

            logger.info(f"[STT Agent] Groq transcript: '{text}'")
            return text

        except Exception as e:
            logger.error(f"[STT Agent] Groq transcription failed: {e}", exc_info=True)
            return ""
