import uvicorn
import json
import logging
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from config import PORT
from agents.stt_agent import STTAgent
from agents.llm_agent import LLMAgent
from agents.tts_agent import TTSAgent
from agents.ranker_agent import RankerAgent
from utils.webhook_client import post_call_results
from utils.audio_utils import decode_twilio_payload, compute_rms

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# ── VAD thresholds (Twilio streams 160-byte mulaw chunks every 20ms at 8000Hz) ─
VAD_SILENCE_THRESHOLD    = 400   # RMS below this = silence
VAD_SILENCE_CHUNKS_NEEDED = 50   # 50 × 20ms = ~1 second of silence → end-of-utterance
VAD_MAX_SPEECH_BYTES     = 160 * 1500  # safety cap: ~30 seconds of continuous speech

@app.get("/")
async def root():
    return {"status": "online", "service": "AntiTalk Python AI Engine", "websocket": "/media-stream"}

@app.websocket("/media-stream")
async def media_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted.")

    stt    = STTAgent()
    tts    = TTSAgent()
    ranker = RankerAgent()
    llm    = None  # initialized in 'start' event once we know the campaign questions

    stream_sid   = None
    candidate_id = None

    # ── VAD state machine ──────────────────────────────────────────────────────
    speech_buffer   = bytearray()
    silence_count   = 0
    candidate_spoke = False

    # ── AI speaking guard ──────────────────────────────────────────────────────
    # While True, all incoming audio is ignored to prevent self-barge-in.
    ai_state = {"is_speaking": False}
    tts_task = None

    async def run_tts_wrapper(text: str):
        ai_state["is_speaking"] = True
        try:
            await stream_tts(websocket, stream_sid, tts, text)
        except asyncio.CancelledError:
            logger.info("TTS task cancelled (barge-in).")
            raise
        finally:
            ai_state["is_speaking"] = False

    async def process_utterance(raw_audio: bytes):
        nonlocal tts_task
        if llm is None:
            logger.warning("LLM not ready yet — skipping utterance.")
            return
        transcript = await stt.process_audio(raw_audio)
        if not transcript or not transcript.strip():
            logger.info("Empty transcript, skipping.")
            return
        response_text = await llm.generate_response(transcript)
        print(f"\033[92m[🗣️ TTS AGENT] Synthesizing & streaming audio:\033[0m \"{response_text}\"")
        tts_task = asyncio.create_task(run_tts_wrapper(response_text))

    try:
        while True:
            message    = await websocket.receive_text()
            data       = json.loads(message)
            event_type = data.get("event")

            # ── Twilio: connection confirmed ───────────────────────────────────
            if event_type == "connected":
                logger.info("Twilio connected to media stream.")

            # ── Twilio: stream started ─────────────────────────────────────────
            elif event_type == "start":
                stream_sid    = data['start']['streamSid']
                custom_params = data['start'].get('customParameters', {})
                candidate_id  = custom_params.get('candidateId', 'unknown_candidate')
                logger.info(f"Stream started. StreamSid: {stream_sid}, CandidateId: {candidate_id}")

                # ── Parse HR-defined questions from TwiML stream parameters ────
                questions_json_str = custom_params.get('questionsJson', '[]')
                try:
                    questions_data = json.loads(questions_json_str)
                    question_texts = [
                        q['text'] for q in questions_data if q.get('text', '').strip()
                    ]
                    key_criteria = [
                        q.get('key_criteria', '') or ''
                        for q in questions_data if q.get('text', '').strip()
                    ]
                    logger.info(f"Loaded {len(question_texts)} HR questions from stream params.")
                except Exception as parse_err:
                    logger.warning(f"Could not parse questionsJson: {parse_err}. Using defaults.")
                    question_texts = []
                    key_criteria   = []

                # Initialize LLM agent with campaign's questions
                llm = LLMAgent(
                    questions    = question_texts if question_texts else None,
                    key_criteria = key_criteria   if key_criteria   else None
                )

                # Send greeting
                greeting = (
                    "Hello! This is the AntiTalk AI calling on behalf of the recruiting team. "
                    "Thank you for taking the time to speak with us today. "
                    "How are you doing?"
                )
                tts_task = asyncio.create_task(run_tts_wrapper(greeting))

            # ── Twilio: incoming audio chunk ────────────────────────────────────
            elif event_type == "media":
                payload     = data['media']['payload']
                audio_bytes = decode_twilio_payload(payload)

                # GUARD: drop audio while AI is speaking (prevents self-barge-in)
                if ai_state["is_speaking"]:
                    continue

                rms = compute_rms(audio_bytes)

                if rms > VAD_SILENCE_THRESHOLD:
                    # ── Active speech ───────────────────────────────────────────
                    speech_buffer.extend(audio_bytes)
                    silence_count   = 0
                    candidate_spoke = True

                    if len(speech_buffer) >= VAD_MAX_SPEECH_BYTES:
                        logger.info("Max speech duration reached; processing buffer.")
                        raw = bytes(speech_buffer)
                        speech_buffer.clear()
                        silence_count   = 0
                        candidate_spoke = False
                        await process_utterance(raw)
                else:
                    # ── Silence ─────────────────────────────────────────────────
                    if candidate_spoke:
                        silence_count += 1
                        speech_buffer.extend(audio_bytes)

                        if silence_count >= VAD_SILENCE_CHUNKS_NEEDED:
                            logger.info(
                                f"End-of-utterance: {len(speech_buffer)} bytes of audio captured."
                            )
                            raw = bytes(speech_buffer)
                            speech_buffer.clear()
                            silence_count   = 0
                            candidate_spoke = False
                            await process_utterance(raw)

            # ── Twilio: stream stopped ──────────────────────────────────────────
            elif event_type == "stop":
                logger.info("Twilio stream stopped.")
                break

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
    except Exception as e:
        logger.error(f"Error in media stream: {e}", exc_info=True)
    finally:
        if tts_task and not tts_task.done():
            logger.info("Cancelling active TTS task.")
            tts_task.cancel()

        logger.info("Processing post-call analysis...")
        ai_score, dossier = ranker.evaluate_interview(
            llm.conversation_history if llm else [],
            getattr(llm, 'fluency_scores',  []),
            getattr(llm, 'off_topic_flags', [])
        )
        post_call_results(candidate_id, ai_score, dossier)
        logger.info("Call analysis completed and webhook fired.")


async def stream_tts(websocket: WebSocket, stream_sid: str, tts: TTSAgent, text: str):
    """Generates audio payloads and streams them back to Twilio."""
    try:
        async for payload in tts.generate_audio_payloads(text):
            await websocket.send_text(json.dumps({
                "event":    "media",
                "streamSid": stream_sid,
                "media":    {"payload": payload}
            }))
    except (WebSocketDisconnect, RuntimeError) as e:
        logger.info(f"stream_tts stopped due to WebSocket closure: {e}")
    except asyncio.CancelledError:
        logger.info("stream_tts cancelled.")
        raise


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
