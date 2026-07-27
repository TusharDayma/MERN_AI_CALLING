from config import USE_MOCK_AGENTS, WHISPER_MODEL
import logging
import asyncio

logger = logging.getLogger(__name__)

class STTAgent:
    def __init__(self):
        self.is_mock = USE_MOCK_AGENTS
        self.call_count = 0
        self.model = None
        
        if not self.is_mock:
            try:
                from faster_whisper import WhisperModel
                logger.info(f"Loading faster-whisper model: {WHISPER_MODEL} on CPU...")
                self.model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
                logger.info("faster-whisper model loaded successfully.")
            except Exception as e:
                logger.warning(f"Could not load faster-whisper: {e}. Falling back to dynamic mock answers for candidate speech.")

    async def process_audio(self, pcm_bytes: bytes) -> str:
        """
        Transcribes the provided audio bytes.
        """
        # If mock mode OR the whisper model failed to load, use dynamic mock answers
        if self.is_mock or self.model is None:
            await asyncio.sleep(0.5)
            self.call_count += 1
            
            # Pre-screening style mock candidate responses
            mock_replies = {
                1: "Hi, I'm doing well, thank you for reaching out. Yes, I'm ready for the screening.",
                2: "Sure. I'm a full-stack developer with about 4 years of experience. I'm currently working at a mid-sized tech startup as a senior software developer. My primary skills are React, Node.js, and Python.",
                3: "My current CTC is 14 lakhs per annum, and I'm looking for something in the range of 18 to 20 lakhs for the new role.",
                4: "My notice period is 30 days. However, I've already started the process and I believe I can negotiate an early release of around 15 days.",
                5: "Yes, I am open to relocation. I'm currently based in Bangalore, but I'm flexible about moving if the role and the company are the right fit.",
                6: "I prefer a hybrid work model — around 2 to 3 days in the office per week. But I'm adaptable depending on the team's requirements.",
                7: "Thank you so much for speaking with me today. I'm very interested in this opportunity and I look forward to hearing from your team. Have a great day. Goodbye."
            }
            
            reply = mock_replies.get(self.call_count, "I have experience and I am actively looking for new opportunities.")
            print(f"\033[93m[🎙️ STT AGENT] Transcript result:\033[0m \"{reply}\"")
            return reply

        # Real implementation using faster-whisper:
        try:
            import numpy as np
            audio_array = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            
            # Run transcription in a separate thread to prevent blocking FastAPI's loop
            segments, info = await asyncio.to_thread(self.model.transcribe, audio_array, beam_size=5)
            text = " ".join([segment.text for segment in segments]).strip()
            print(f"\033[93m[🎙️ STT AGENT] Transcript result:\033[0m \"{text}\"")
            return text
        except Exception as e:
            logger.error(f"Error transcribing audio with Whisper: {e}")
            print(f"\033[91m[🎙️ STT AGENT] Error transcribing audio: {e}\033[0m")
            return "Could not transcribe audio."
