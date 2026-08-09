from config import USE_MOCK_AGENTS, FISH_AUDIO_API_KEY, FISH_AUDIO_MODEL, FISH_AUDIO_VOICE_ID
import asyncio
import logging
import io
import wave
import audioop
import os
import edge_tts
import time
from utils.audio_utils import encode_twilio_payload
from services.fish_audio_tts import FishAudioTTS
from utils.telemetry import record_tts_latency

logger = logging.getLogger(__name__)

EDGE_TTS_VOICE = os.getenv("TTS_VOICE", "en-US-AvaNeural")


class TTSAgent:
    """
    Text-to-Speech synthesis agent.
    Synthesizes speech via Fish Audio S2.1 Pro or Edge TTS fallback, and streams 8kHz mulaw base64 audio chunks.
    Uses in-memory processing to eliminate subprocess and disk I/O overhead.
    """

    def __init__(self):
        self.is_mock = USE_MOCK_AGENTS
        self.fish_audio = FishAudioTTS(
            api_key=FISH_AUDIO_API_KEY,
            model=FISH_AUDIO_MODEL,
            voice_id=FISH_AUDIO_VOICE_ID,
        ) if FISH_AUDIO_API_KEY else None

    async def generate_audio_payloads(self, text: str):
        """Synthesizes text and yields 8-bit 8kHz mu-law base64 payloads in 20ms chunks."""
        if not text or not text.strip():
            return

        try:
            mp3_bytes = None
            start_time = time.time()
            first_chunk_yielded = False

            # Primary Engine: Fish Audio S2.1 Pro
            if self.fish_audio and FISH_AUDIO_API_KEY:
                try:
                    chunks = []
                    async for chunk in self.fish_audio.stream_audio_chunks(text, format="mp3"):
                        chunks.append(chunk)
                    if chunks:
                        mp3_bytes = b"".join(chunks)
                except Exception as fa_err:
                    logger.warning(f"[TTS Agent] Fish Audio TTS failed ({fa_err}). Falling back to Edge TTS.")
                    mp3_bytes = None

            # Fallback Engine: Edge TTS
            if not mp3_bytes:
                communicate = edge_tts.Communicate(text, EDGE_TTS_VOICE)
                mp3_io = io.BytesIO()
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        mp3_io.write(chunk["data"])
                mp3_bytes = mp3_io.getvalue()

            if not mp3_bytes:
                logger.error("[TTS Agent] Failed to generate audio bytes from TTS engines.")
                return

            # Convert MP3 bytes to PCM/WAV in memory via pydub
            raw_frames = None
            try:
                from pydub import AudioSegment
                segment = AudioSegment.from_file(io.BytesIO(mp3_bytes), format="mp3")
                segment = segment.set_frame_rate(8000).set_channels(1).set_sample_width(2)

                wav_io = io.BytesIO()
                segment.export(wav_io, format="wav")
                wav_bytes = wav_io.getvalue()

                with wave.open(io.BytesIO(wav_bytes), 'rb') as wf:
                    raw_frames = wf.readframes(wf.getnframes())

            except Exception as cvt_err:
                logger.warning(f"[TTS Agent] Pydub conversion error ({cvt_err}). Generating fallback audio frames.")
                import math
                # Generate ~2.5 seconds of 8kHz 16-bit PCM audio tone (440Hz sine wave)
                sample_rate = 8000
                duration_sec = min(len(text) * 0.08, 4.0)
                total_samples = int(sample_rate * duration_sec)
                pcm_buf = bytearray()
                for n in range(total_samples):
                    val = int(8000 * math.sin(2 * math.pi * 440 * n / sample_rate))
                    pcm_buf.extend(val.to_bytes(2, byteorder='little', signed=True))
                raw_frames = bytes(pcm_buf)

            # Convert 16-bit linear PCM -> 8-bit u-law PCM
            mulaw_data = audioop.lin2ulaw(raw_frames, 2)

            # Stream in 160-byte (20ms @ 8kHz) telephony chunks
            chunk_size = 160
            for idx, i in enumerate(range(0, len(mulaw_data), chunk_size)):
                chunk = mulaw_data[i:i + chunk_size]
                if len(chunk) < chunk_size:
                    chunk = chunk.ljust(chunk_size, b'\xff')
                if not first_chunk_yielded:
                    first_chunk_yielded = True
                    latency_ms = (time.time() - start_time) * 1000
                    record_tts_latency(latency_ms)

                yield encode_twilio_payload(chunk)

                # Populate client jitter buffer quickly for first 10 frames, then pace
                if idx < 10:
                    await asyncio.sleep(0.001)
                else:
                    await asyncio.sleep(0.015)

        except Exception as e:
            logger.error(f"[TTS Agent] Error in generate_audio_payloads: {e}", exc_info=True)
