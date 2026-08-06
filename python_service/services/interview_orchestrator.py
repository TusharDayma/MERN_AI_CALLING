import json
import logging
import asyncio
import time
from fastapi import WebSocket, WebSocketDisconnect
from agents.stt_agent import STTAgent
from agents.llm_agent import LLMAgent
from agents.tts_agent import TTSAgent
from agents.ranker_agent import RankerAgent
from utils.webhook_client import post_call_results
from utils.audio_utils import decode_twilio_payload_to_pcm16, compute_rms_pcm

logger = logging.getLogger(__name__)

# Tuned VAD constants for 8kHz 16-bit PCM (320 bytes per 20ms chunk)
VAD_SILENCE_THRESHOLD = 350
VAD_SILENCE_CHUNKS_NEEDED = 20  # ~400ms of silence to trigger response
VAD_MAX_SPEECH_BYTES = 320 * 1500  # Max ~30 sec continuous speech


class AudioStreamManager:
    """Manages real-time WebSocket audio streaming, VAD, barge-in, and TTS/STT/LLM orchestration."""

    def __init__(self, websocket: WebSocket, stream_sid: str, tts_agent: TTSAgent, llm_agent: LLMAgent, stt_agent: STTAgent):
        self.websocket = websocket
        self.stream_sid = stream_sid
        self.tts = tts_agent
        self.llm = llm_agent
        self.stt = stt_agent
        
        self.speech_buffer = bytearray()
        self.silence_count = 0
        self.candidate_spoke = False
        
        self.is_speaking = False
        self.tts_task = None
        self._tts_cancel_event = asyncio.Event()
        self.speaking_start_time = 0

    async def send_log(self, message: str):
        """Sends non-blocking log notification over WebSocket."""
        try:
            await self.websocket.send_text(json.dumps({"event": "log", "message": message}))
        except Exception:
            pass

    async def stream_tts(self, text: str):
        """Streams generated TTS audio chunks to client WebSocket."""
        try:
            await self.send_log(f"Speaking: '{text[:30]}...'")
            async for media_payload in self.tts.generate_audio_payloads(text):
                if self._tts_cancel_event.is_set():
                    break
                    
                outbound = {
                    "event": "media",
                    "streamSid": self.stream_sid,
                    "media": {"payload": media_payload}
                }
                await self.websocket.send_text(json.dumps(outbound))
        except Exception as e:
            logger.error(f"[Orchestrator] Error in stream_tts: {e}")

    async def run_tts_wrapper(self, text: str):
        """Wraps TTS execution with timing and cancellation tracking."""
        self.is_speaking = True
        self.speaking_start_time = time.time()
        self._tts_cancel_event.clear()
        try:
            await self.stream_tts(text)
        except asyncio.CancelledError:
            logger.info("[Orchestrator] TTS task cancelled (barge-in).")
            await self.send_log("Speech cancelled due to barge-in.")
        finally:
            self.is_speaking = False

    def cancel_tts(self):
        """Cancels active TTS task immediately on barge-in or user input."""
        if self.tts_task and not self.tts_task.done():
            self._tts_cancel_event.set()
            self.tts_task.cancel()
        self.is_speaking = False

    async def process_utterance(self, raw_audio: bytes):
        """Passes captured candidate utterance audio to STT -> LLM -> TTS pipeline."""
        if not raw_audio or not self.llm:
            return

        await self.send_log("Processing candidate audio...")
        text = await self.stt.process_audio(bytes(raw_audio))
        if not text.strip():
            await self.send_log("STT returned empty text.")
            return

        logger.info(f"[Orchestrator] Candidate said: '{text}'")
        await self.send_log(f"You said: '{text}'")
        
        ai_reply = await self.llm.generate_response(text)
        logger.info(f"[Orchestrator] AI response: '{ai_reply}'")

        self.cancel_tts()
        self.tts_task = asyncio.create_task(self.run_tts_wrapper(ai_reply))

    async def handle_media(self, payload: str):
        """Decodes inbound media frames and processes Voice Activity Detection (VAD)."""
        if not payload:
            return

        pcm_chunk = decode_twilio_payload_to_pcm16(payload)
        rms = compute_rms_pcm(pcm_chunk)

        # Barge-in detection during AI speech
        if self.is_speaking:
            time_speaking = time.time() - self.speaking_start_time
            if time_speaking > 1.5 and rms > 4500:  # Increased thresholds to prevent false positives from echo
                logger.info(f"[Orchestrator] Barge-in detected! RMS: {rms}")
                await self.send_log(f"Barge-in detected! (Level {rms})")
                self.cancel_tts()
                self.speech_buffer.clear()
                self.silence_count = 0
            return

        # VAD Speech & Silence tracking
        if rms < VAD_SILENCE_THRESHOLD:
            if self.candidate_spoke:
                self.silence_count += 1
                self.speech_buffer.extend(pcm_chunk)
                if self.silence_count >= VAD_SILENCE_CHUNKS_NEEDED:
                    audio_to_process = bytes(self.speech_buffer)
                    self.speech_buffer.clear()
                    self.silence_count = 0
                    self.candidate_spoke = False
                    asyncio.create_task(self.process_utterance(audio_to_process))
        else:
            if not self.candidate_spoke:
                await self.send_log("Detected candidate speech...")
            self.candidate_spoke = True
            self.silence_count = 0
            self.speech_buffer.extend(pcm_chunk)
            if len(self.speech_buffer) >= VAD_MAX_SPEECH_BYTES:
                audio_to_process = bytes(self.speech_buffer)
                self.speech_buffer.clear()
                self.candidate_spoke = False
                asyncio.create_task(self.process_utterance(audio_to_process))

    def clear_state(self):
        """Flushes active buffers and TTS task on clear signal."""
        logger.info("[Orchestrator] Clear event received — flushing state.")
        self.cancel_tts()
        self.speech_buffer.clear()
        self.silence_count = 0
        self.candidate_spoke = False


async def handle_interview_stream(websocket: WebSocket):
    """FastAPI WebSocket connection endpoint handler."""
    await websocket.accept()
    logger.info("[Orchestrator] WebSocket connection accepted.")

    stt = STTAgent()
    tts = TTSAgent()
    ranker = RankerAgent()
    llm = None
    stream_manager = None
    candidate_id = None

    try:
        while True:
            raw_msg = await websocket.receive_text()
            data = json.loads(raw_msg)
            event = data.get("event")

            if event == "start":
                start_data = data.get("start", {})
                stream_sid = data.get("streamSid")
                custom_params = start_data.get("customParameters", {})

                candidate_id = (
                    websocket.query_params.get("candidateId") or 
                    custom_params.get("candidateId") or 
                    custom_params.get("candidate_id")
                )
                questions_json = (
                    websocket.query_params.get("questionsJson") or 
                    custom_params.get("questionsJson") or 
                    custom_params.get("questions_json", "[]")
                )
                candidate_name = (
                    websocket.query_params.get("candidateName") or 
                    custom_params.get("candidateName") or 
                    custom_params.get("candidate_name", "Candidate")
                )
                is_scheduled_str = (
                    websocket.query_params.get("is_scheduled") or 
                    custom_params.get("is_scheduled") or 
                    "false"
                )
                is_scheduled_flag = str(is_scheduled_str).lower() == "true"

                try:
                    questions_raw = json.loads(questions_json)
                except Exception:
                    questions_raw = []

                questions = [q.get("text", "") for q in questions_raw if q.get("text")]
                key_criteria = [q.get("key_criteria", "") for q in questions_raw if q.get("text")]

                logger.info(f"[Orchestrator] Stream started. CandidateID={candidate_id}, Questions={len(questions)}, Scheduled={is_scheduled_flag}")

                llm = LLMAgent(
                    candidate_name=candidate_name,
                    questions=questions if questions else None,
                    key_criteria=key_criteria if key_criteria else None,
                    current_channel="Voice",
                    is_scheduled=is_scheduled_flag
                )

                stream_manager = AudioStreamManager(websocket, stream_sid, tts, llm, stt)
                greeting = llm.get_initial_greeting()
                stream_manager.tts_task = asyncio.create_task(stream_manager.run_tts_wrapper(greeting))

            elif event == "media":
                if stream_manager:
                    await stream_manager.handle_media(data.get("media", {}).get("payload"))

            elif event == "stop":
                logger.info("[Orchestrator] Stream stop event received.")
                break

            elif event == "clear":
                if stream_manager:
                    stream_manager.clear_state()

    except WebSocketDisconnect:
        logger.info("[Orchestrator] WebSocket disconnected.")
    except Exception as e:
        logger.error(f"[Orchestrator] WebSocket error: {e}", exc_info=True)
    finally:
        if stream_manager:
            stream_manager.cancel_tts()

        if llm and candidate_id:
            score, dossier = ranker.evaluate_interview(
                conversation_history=llm.conversation_history,
                fluency_scores=llm.fluency_scores,
                off_topic_flags=llm.off_topic_flags
            )
            final_status = getattr(llm, 'candidate_status', 'COMPLETED')
            await post_call_results(candidate_id, score, dossier, status=final_status)
