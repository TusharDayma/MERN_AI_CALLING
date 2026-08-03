import json
import logging
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from agents.stt_agent import STTAgent
from agents.llm_agent import LLMAgent
from agents.tts_agent import TTSAgent
from agents.ranker_agent import RankerAgent
from utils.webhook_client import post_call_results
from utils.audio_utils import decode_twilio_payload, compute_rms

logger = logging.getLogger(__name__)

VAD_SILENCE_THRESHOLD = 400
VAD_SILENCE_CHUNKS_NEEDED = 50
VAD_MAX_SPEECH_BYTES = 160 * 1500

class AudioStreamManager:
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

    async def stream_tts(self, text: str):
        try:
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
            logger.error(f"Error in stream_tts: {e}")

    async def run_tts_wrapper(self, text: str):
        self.is_speaking = True
        self._tts_cancel_event.clear()
        try:
            await self.stream_tts(text)
        except asyncio.CancelledError:
            logger.info("TTS task cancelled (barge-in).")
        finally:
            self.is_speaking = False

    def cancel_tts(self):
        if self.tts_task and not self.tts_task.done():
            self._tts_cancel_event.set()
            self.tts_task.cancel()
        self.is_speaking = False

    async def process_utterance(self, raw_audio: bytes):
        if not raw_audio or not self.llm:
            return

        text = await self.stt.process_audio(bytes(raw_audio))
        if not text.strip():
            return

        logger.info(f"Candidate said: '{text}'")
        ai_reply = await self.llm.generate_response(text)
        logger.info(f"AI response: '{ai_reply}'")

        self.cancel_tts()
        self.tts_task = asyncio.create_task(self.run_tts_wrapper(ai_reply))

    async def handle_media(self, payload: str):
        if not payload:
            return

        raw_chunk = decode_twilio_payload(payload)
        rms = compute_rms(raw_chunk)

        if self.is_speaking and rms > VAD_SILENCE_THRESHOLD * 2:
            logger.info("Barge-in detected!")
            self.cancel_tts()
            self.speech_buffer.clear()
            self.silence_count = 0
            return

        if rms < VAD_SILENCE_THRESHOLD:
            if self.candidate_spoke:
                self.silence_count += 1
                self.speech_buffer.extend(raw_chunk)
                if self.silence_count >= VAD_SILENCE_CHUNKS_NEEDED:
                    audio_to_process = bytes(self.speech_buffer)
                    self.speech_buffer.clear()
                    self.silence_count = 0
                    self.candidate_spoke = False
                    await self.process_utterance(audio_to_process)
        else:
            self.candidate_spoke = True
            self.silence_count = 0
            self.speech_buffer.extend(raw_chunk)
            if len(self.speech_buffer) >= VAD_MAX_SPEECH_BYTES:
                audio_to_process = bytes(self.speech_buffer)
                self.speech_buffer.clear()
                self.candidate_spoke = False
                await self.process_utterance(audio_to_process)

    def clear_state(self):
        logger.info("Exotel 'clear' event received — flushing TTS task and speech buffers.")
        self.cancel_tts()
        self.speech_buffer.clear()
        self.silence_count = 0
        self.candidate_spoke = False


async def handle_interview_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted.")

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

                candidate_id = websocket.query_params.get("candidateId") or custom_params.get("candidateId") or custom_params.get("candidate_id")
                questions_json = websocket.query_params.get("questionsJson") or custom_params.get("questionsJson") or custom_params.get("questions_json", "[]")

                try:
                    questions_raw = json.loads(questions_json)
                except Exception:
                    questions_raw = []

                questions = [q.get("text", "") for q in questions_raw if q.get("text")]
                key_criteria = [q.get("key_criteria", "") for q in questions_raw if q.get("text")]

                logger.info(f"Stream started. CandidateID={candidate_id}, Questions={len(questions)}")

                llm = LLMAgent(
                    questions=questions if questions else None,
                    key_criteria=key_criteria if key_criteria else None,
                    current_channel="Voice",
                    is_scheduled=False
                )

                stream_manager = AudioStreamManager(websocket, stream_sid, tts, llm, stt)
                
                greeting = llm.get_initial_greeting()
                stream_manager.tts_task = asyncio.create_task(stream_manager.run_tts_wrapper(greeting))

            elif event == "media":
                if stream_manager:
                    await stream_manager.handle_media(data.get("media", {}).get("payload"))

            elif event == "stop":
                logger.info("Stream stop received (Exotel/Twilio).")
                break

            elif event == "clear":
                if stream_manager:
                    stream_manager.clear_state()

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
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
