from config import USE_MOCK_AGENTS
import asyncio
import logging
import uuid
import os
import wave
import audioop
import pyttsx3
from utils.audio_utils import encode_twilio_payload

logger = logging.getLogger(__name__)

def _generate_wav(text: str, filepath: str):
    try:
        engine = pyttsx3.init()
        # Set a slightly slower speaking rate for clarity over phone streams
        rate = engine.getProperty('rate')
        engine.setProperty('rate', max(rate - 20, 150))
        engine.save_to_file(text, filepath)
        engine.runAndWait()
    except Exception as e:
        logger.error(f"Error in pyttsx3 subprocess generation: {e}")

class TTSAgent:
    def __init__(self):
        self.is_mock = USE_MOCK_AGENTS
        if not self.is_mock:
            # Initialize kokoro-onnx model if available, otherwise fallback to pyttsx3
            pass

    async def generate_audio_payloads(self, text: str):
        """
        Converts text to speech and yields base64 mulaw payloads in real-time.
        """
        temp_filename = os.path.join(os.path.dirname(__file__), f"temp_{uuid.uuid4().hex}.wav")
        
        try:
            # Run blocking pyttsx3 generation in a separate thread to prevent blocking FastAPI
            await asyncio.to_thread(_generate_wav, text, temp_filename)
            
            if not os.path.exists(temp_filename):
                logger.error(f"Failed to generate TTS WAV file at {temp_filename}")
                return
                
            with wave.open(temp_filename, 'rb') as wf:
                n_channels = wf.getnchannels()
                samp_width = wf.getsampwidth()
                frame_rate = wf.getframerate()
                n_frames = wf.getnframes()
                raw_frames = wf.readframes(n_frames)
                
            # Convert stereo to mono
            if n_channels == 2:
                raw_frames = audioop.tomono(raw_frames, samp_width, 0.5, 0.5)
                n_channels = 1
                
            # Convert sample width to 16-bit PCM (2 bytes)
            if samp_width != 2:
                raw_frames = audioop.lin2lin(raw_frames, samp_width, 2)
                samp_width = 2
                
            # Resample to 8000Hz (Twilio's expected sample rate)
            if frame_rate != 8000:
                raw_frames, _ = audioop.ratecv(raw_frames, 2, 1, frame_rate, 8000, None)
                
            # Convert 16-bit linear PCM to 8-bit mu-law
            mulaw_data = audioop.lin2ulaw(raw_frames, 2)
            
            # Twilio streams expect 20ms chunks.
            # At 8000Hz 8-bit mulaw, each 20ms chunk is exactly 160 bytes.
            chunk_size = 160
            for i in range(0, len(mulaw_data), chunk_size):
                chunk = mulaw_data[i:i+chunk_size]
                if len(chunk) < chunk_size:
                    chunk = chunk.ljust(chunk_size, b'\xff')
                
                yield encode_twilio_payload(chunk)
                # Sleep 20ms to stream in real-time
                await asyncio.sleep(0.02)
                
        except Exception as e:
            logger.error(f"Error in generate_audio_payloads: {e}", exc_info=True)
        finally:
            if os.path.exists(temp_filename):
                try:
                    os.remove(temp_filename)
                except Exception:
                    pass

