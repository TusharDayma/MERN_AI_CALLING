from config import USE_MOCK_AGENTS
import asyncio
import logging
import uuid
import os
import wave
import audioop
import tempfile
import edge_tts
from utils.audio_utils import encode_twilio_payload

logger = logging.getLogger(__name__)

# Best English voice from Microsoft Edge TTS
EDGE_TTS_VOICE = "en-US-JennyNeural"


class TTSAgent:
    def __init__(self):
        self.is_mock = USE_MOCK_AGENTS
        logger.info("[TTS Agent] Using Microsoft Edge TTS (edge-tts). Voice: " + EDGE_TTS_VOICE)

    async def generate_audio_payloads(self, text: str):
        """
        Converts text to speech using edge-tts and yields base64 mulaw payloads.
        edge-tts is fully async-native — no COM, no subprocess, no threading issues.
        """
        temp_mp3 = os.path.join(tempfile.gettempdir(), f"tts_{uuid.uuid4().hex}.mp3")
        temp_wav = os.path.join(tempfile.gettempdir(), f"tts_{uuid.uuid4().hex}.wav")

        try:
            # Step 1: Generate MP3 from edge-tts
            communicate = edge_tts.Communicate(text, EDGE_TTS_VOICE)
            await communicate.save(temp_mp3)
            logger.info(f"[TTS Agent] edge-tts generated MP3: {temp_mp3}")

            # Step 2: Convert MP3 → WAV using ffmpeg (available on most systems)
            # We use audioop for the conversion pipeline, but first need PCM wav from mp3
            # Use Python's subprocess to call ffmpeg for mp3->wav conversion
            import subprocess, sys
            result = subprocess.run(
                ["ffmpeg", "-y", "-i", temp_mp3, "-ar", "8000", "-ac", "1", "-f", "wav", temp_wav],
                capture_output=True
            )

            if result.returncode != 0 or not os.path.exists(temp_wav):
                # Fallback: try via pydub if ffmpeg not available
                logger.warning("[TTS Agent] ffmpeg not found or failed, trying pydub fallback...")
                try:
                    from pydub import AudioSegment
                    audio = AudioSegment.from_mp3(temp_mp3)
                    audio = audio.set_frame_rate(8000).set_channels(1).set_sample_width(2)
                    audio.export(temp_wav, format="wav")
                except Exception as pydub_e:
                    logger.error(f"[TTS Agent] pydub fallback also failed: {pydub_e}")
                    return

            # Step 3: Read WAV and convert to mu-law chunks
            with wave.open(temp_wav, 'rb') as wf:
                n_channels = wf.getnchannels()
                samp_width = wf.getsampwidth()
                frame_rate = wf.getframerate()
                n_frames = wf.getnframes()
                raw_frames = wf.readframes(n_frames)

            # Ensure mono
            if n_channels == 2:
                raw_frames = audioop.tomono(raw_frames, samp_width, 0.5, 0.5)

            # Ensure 16-bit
            if samp_width != 2:
                raw_frames = audioop.lin2lin(raw_frames, samp_width, 2)

            # Resample to 8000 Hz if needed
            if frame_rate != 8000:
                raw_frames, _ = audioop.ratecv(raw_frames, 2, 1, frame_rate, 8000, None)

            # Convert to 8-bit mu-law
            mulaw_data = audioop.lin2ulaw(raw_frames, 2)

            # Stream in 20ms chunks (160 bytes at 8kHz)
            chunk_size = 160
            for i in range(0, len(mulaw_data), chunk_size):
                chunk = mulaw_data[i:i + chunk_size]
                if len(chunk) < chunk_size:
                    chunk = chunk.ljust(chunk_size, b'\xff')
                yield encode_twilio_payload(chunk)
                await asyncio.sleep(0.02)

        except Exception as e:
            logger.error(f"[TTS Agent] Error in generate_audio_payloads: {e}", exc_info=True)
        finally:
            for f in [temp_mp3, temp_wav]:
                if os.path.exists(f):
                    try:
                        os.remove(f)
                    except Exception:
                        pass
