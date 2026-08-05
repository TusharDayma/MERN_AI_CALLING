# coding: utf-8
"""
AntiTalk AI Engine - Agentic Test Suite
=========================================
Autonomously tests STT (Groq Whisper), TTS (Fish Audio / Edge TTS),
and Brain LLM (Groq LLaMA) with REAL API calls.

Run with:
    python agentic_test.py            # full real-API test
    python agentic_test.py --mock     # mock-mode only (no API keys needed)
    python agentic_test.py --suite stt tts brain  # pick suites

Each test agent decides autonomously:
  - PASS  -> result meets expectations
  - WARN  -> result works but is degraded / slow
  - FAIL  -> result is broken or timed-out
"""

import os
import sys
import asyncio
import time
import wave
import io
import math
import json
import argparse
import logging

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

logging.basicConfig(level=logging.ERROR)

if hasattr(sys.stdout, "buffer"):
    import io as _io
    sys.stdout = _io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

CYAN    = "\033[96m"
GREEN   = "\033[92m"
YELLOW  = "\033[93m"
RED     = "\033[91m"
BLUE    = "\033[94m"
MAGENTA = "\033[95m"
BOLD    = "\033[1m"
DIM     = "\033[2m"
RESET   = "\033[0m"

TICK  = f"{GREEN}[PASS]{RESET}"
CROSS = f"{RED}[FAIL]{RESET}"
WARN_TAG = f"{YELLOW}[WARN]{RESET}"
INFO_TAG = f"{CYAN}[INFO]{RESET}"

_results = {"passed": 0, "failed": 0, "warned": 0, "details": []}


def _banner(title, char="="):
    width = 68
    line = char * width
    print(f"\n{CYAN}{line}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{CYAN}{line}{RESET}")


def _record(name, status, detail="", elapsed=None):
    timing = f"  {DIM}({elapsed:.2f}s){RESET}" if elapsed is not None else ""
    if status == "PASS":
        _results["passed"] += 1
        icon = TICK
    elif status == "WARN":
        _results["warned"] += 1
        icon = WARN_TAG
    else:
        _results["failed"] += 1
        icon = CROSS
    _results["details"].append({"name": name, "status": status, "detail": detail})
    print(f"  {icon} {name}{timing}")
    if detail:
        print(f"        {DIM}-> {detail}{RESET}")


def _info(msg):
    print(f"  {INFO_TAG} {msg}")


def _generate_wav_bytes(duration_sec=2.0):
    sample_rate = 8000
    total_samples = int(sample_rate * duration_sec)
    pcm = bytearray()
    for n in range(total_samples):
        freq = 440 + 80 * math.sin(2 * math.pi * 1.5 * n / sample_rate)
        val = int(4000 * math.sin(2 * math.pi * freq * n / sample_rate))
        val = max(-32767, min(32767, val))
        pcm.extend(val.to_bytes(2, byteorder="little", signed=True))
    wav_io = io.BytesIO()
    with wave.open(wav_io, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(bytes(pcm))
    return wav_io.getvalue()


def _wav_to_raw_pcm(wav_bytes):
    with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
        return wf.readframes(wf.getnframes())


# =============================================================================
# AGENT 1 - Configuration & Connectivity
# =============================================================================
async def agent_config(use_mock):
    _banner("Agent 1 . Configuration & API Key Validation")

    from config import (
        PORT, USE_MOCK_AGENTS, EXPRESS_WEBHOOK_URL,
        GROQ_API_KEY, GROQ_STT_MODEL, GROQ_LLM_MODEL, GROQ_RANKER_MODEL,
        FISH_AUDIO_API_KEY, FISH_AUDIO_MODEL, FISH_AUDIO_VOICE_ID,
        STT_MODEL, TTS_MODEL, BRAIN_MODEL, RANKER_MODEL,
        TWILIO_SAMPLE_RATE, TWILIO_CHANNELS,
    )

    _record("PORT is a valid integer > 0",
            "PASS" if isinstance(PORT, int) and PORT > 0 else "FAIL",
            f"PORT={PORT}")
    _record("EXPRESS_WEBHOOK_URL starts with http",
            "PASS" if isinstance(EXPRESS_WEBHOOK_URL, str) and EXPRESS_WEBHOOK_URL.startswith("http") else "FAIL",
            f"URL={EXPRESS_WEBHOOK_URL}")
    _record("TWILIO_SAMPLE_RATE is 8000",
            "PASS" if TWILIO_SAMPLE_RATE == 8000 else "FAIL",
            f"TWILIO_SAMPLE_RATE={TWILIO_SAMPLE_RATE}")
    _record("TWILIO_CHANNELS is 1",
            "PASS" if TWILIO_CHANNELS == 1 else "FAIL",
            f"TWILIO_CHANNELS={TWILIO_CHANNELS}")
    _record("STT_MODEL is configured",
            "PASS" if STT_MODEL and len(STT_MODEL) > 0 else "FAIL",
            f"STT_MODEL={STT_MODEL}")
    _record("TTS_MODEL is configured",
            "PASS" if TTS_MODEL and len(TTS_MODEL) > 0 else "FAIL",
            f"TTS_MODEL={TTS_MODEL}")
    _record("BRAIN_MODEL is configured",
            "PASS" if BRAIN_MODEL and len(BRAIN_MODEL) > 0 else "FAIL",
            f"BRAIN_MODEL={BRAIN_MODEL}")
    _record("RANKER_MODEL is configured",
            "PASS" if RANKER_MODEL and len(RANKER_MODEL) > 0 else "FAIL",
            f"RANKER_MODEL={RANKER_MODEL}")

    if use_mock:
        _info("Skipping API key check (--mock mode).")
        return

    groq_ok = bool(GROQ_API_KEY and len(GROQ_API_KEY) > 10)
    fish_ok = bool(FISH_AUDIO_API_KEY and len(FISH_AUDIO_API_KEY) > 10)
    _record("GROQ_API_KEY is set",
            "PASS" if groq_ok else "FAIL",
            f"Key={'SET (' + GROQ_API_KEY[:8] + '...)' if groq_ok else 'MISSING'}")
    _record("FISH_AUDIO_API_KEY is set",
            "PASS" if fish_ok else "WARN",
            f"Key={'SET (' + FISH_AUDIO_API_KEY[:8] + '...)' if fish_ok else 'MISSING - Edge TTS fallback'}")

    _info(f"Pinging Groq API with model: {GROQ_LLM_MODEL} ...")
    t0 = time.time()
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=GROQ_API_KEY)
        resp = await client.chat.completions.create(
            model=GROQ_LLM_MODEL,
            messages=[{"role": "user", "content": "Reply with exactly: PONG"}],
            max_tokens=5,
            temperature=0
        )
        ping_text = resp.choices[0].message.content.strip()
        elapsed = time.time() - t0
        _record("Groq API connectivity (LLaMA ping)",
                "PASS" if "PONG" in ping_text.upper() else "WARN",
                f"Response: '{ping_text}' in {elapsed:.2f}s",
                elapsed)
    except Exception as e:
        _record("Groq API connectivity (LLaMA ping)", "FAIL", str(e))


# =============================================================================
# AGENT 2 - STT (Speech-to-Text) via Groq Whisper
# =============================================================================
async def agent_stt(use_mock):
    _banner("Agent 2 . STT - Speech-to-Text (Groq Whisper)")

    # config.py caches USE_MOCK_AGENTS at import time, so we must reload config
    # before reloading agent modules to pick up the env override.
    import importlib
    import config as cfg_mod
    import agents.stt_agent as stt_mod

    os.environ["USE_MOCK_AGENTS"] = "true"
    importlib.reload(cfg_mod)
    importlib.reload(stt_mod)
    from agents.stt_agent import STTAgent as STTMock

    stt_mock = STTMock()
    _record("STT Agent (mock) initializes", "PASS" if stt_mock is not None else "FAIL")
    _record("STT Agent is_mock == True", "PASS" if stt_mock.is_mock else "FAIL")

    dummy_pcm = b"\x00" * 1600
    t0 = time.time()
    transcript = await stt_mock.process_audio(dummy_pcm)
    elapsed = time.time() - t0
    _record("STT mock returns non-empty transcript",
            "PASS" if isinstance(transcript, str) and len(transcript) > 0 else "FAIL",
            f'"{transcript}"', elapsed)
    _record("STT mock responds in < 1s",
            "PASS" if elapsed < 1.0 else "WARN",
            f"{elapsed:.3f}s")

    stt2 = STTMock()
    replies = []
    for _ in range(7):
        r = await stt2.process_audio(dummy_pcm)
        replies.append(r)
    _record("STT mock cycles through 7 unique answers",
            "PASS" if len(set(replies)) == 7 else "WARN",
            f"Unique: {len(set(replies))}/7")
    _record("STT mock call_count increments correctly",
            "PASS" if stt2.call_count == 7 else "FAIL",
            f"call_count={stt2.call_count}")

    if use_mock:
        _info("Skipping real STT test (--mock flag).")
        return

    _info("Testing real STT via Groq Whisper with synthetic WAV audio...")
    os.environ["USE_MOCK_AGENTS"] = "false"
    importlib.reload(cfg_mod)
    importlib.reload(stt_mod)
    from agents.stt_agent import STTAgent as STTReal

    stt_real = STTReal()
    _record("STT Real Agent initializes in non-mock mode",
            "PASS" if not stt_real.is_mock else "WARN",
            f"is_mock={stt_real.is_mock}")

    if stt_real._groq_client is None:
        _record("STT Real Groq client created", "FAIL", "Client is None - check GROQ_API_KEY")
        return

    wav_bytes = _generate_wav_bytes(duration_sec=2.0)
    raw_pcm = _wav_to_raw_pcm(wav_bytes)
    _info(f"Synthetic audio: {len(raw_pcm):,} bytes of 8kHz 16-bit PCM")
    _record("Synthetic audio passes length gate (>= 1600 bytes)",
            "PASS" if len(raw_pcm) >= 1600 else "FAIL",
            f"{len(raw_pcm)} bytes")

    t0 = time.time()
    try:
        result = await stt_real.process_audio(raw_pcm)
        elapsed = time.time() - t0
        _record("STT Real API call completed without exception",
                "PASS", f'Transcript: "{result}" ({len(result)} chars)', elapsed)
        _record("STT Real API responded in < 10s",
                "PASS" if elapsed < 10 else "WARN",
                f"{elapsed:.2f}s")
        if result:
            _record("STT Real returned non-empty transcript", "PASS", f'"{result}"')
        else:
            _record("STT Real returned empty (tone audio - noise filtered)",
                    "WARN", "Expected for synthetic tone. API connectivity confirmed.")
    except Exception as e:
        elapsed = time.time() - t0
        _record("STT Real API call completed without exception", "FAIL", str(e), elapsed)

    os.environ["USE_MOCK_AGENTS"] = "false"


# =============================================================================
# AGENT 3 - TTS (Text-to-Speech) via Fish Audio + Edge TTS fallback
# =============================================================================
async def agent_tts(use_mock):
    _banner("Agent 3 . TTS - Text-to-Speech (Fish Audio / Edge TTS)")

    from config import FISH_AUDIO_API_KEY, FISH_AUDIO_MODEL, FISH_AUDIO_VOICE_ID
    test_phrase = "Hello, this is a test of the text to speech system. Can you hear me clearly?"

    _info("Instantiating TTSAgent...")
    try:
        from agents.tts_agent import TTSAgent
        tts = TTSAgent()
        _record("TTSAgent initializes without error", "PASS")
    except Exception as e:
        _record("TTSAgent initializes without error", "FAIL", str(e))
        return

    fish_ready = tts.fish_audio is not None
    _record("Fish Audio client initialized (key present)",
            "PASS" if fish_ready else "WARN",
            f"fish_audio={'ready' if fish_ready else 'None - Edge TTS will be used'}")

    _info("Testing Edge TTS directly (en-US-AvaNeural)...")
    t0 = time.time()
    try:
        import edge_tts
        communicate = edge_tts.Communicate(test_phrase, "en-US-AvaNeural")
        mp3_chunks = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                mp3_chunks.append(chunk["data"])
        elapsed = time.time() - t0
        mp3_bytes = b"".join(mp3_chunks)
        _record("Edge TTS synthesizes audio successfully",
                "PASS" if len(mp3_bytes) > 1000 else "FAIL",
                f"{len(mp3_bytes):,} bytes MP3 in {elapsed:.2f}s", elapsed)
        _record("Edge TTS responds in < 15s",
                "PASS" if elapsed < 15 else "WARN",
                f"{elapsed:.2f}s")
    except Exception as e:
        elapsed = time.time() - t0
        _record("Edge TTS synthesizes audio successfully", "FAIL", str(e), elapsed)

    if use_mock:
        _info("Skipping Fish Audio API test (--mock flag).")
    elif FISH_AUDIO_API_KEY:
        _info(f"Testing Fish Audio API (model={FISH_AUDIO_MODEL})...")
        t0 = time.time()
        try:
            from services.fish_audio_tts import FishAudioTTS
            fa = FishAudioTTS(
                api_key=FISH_AUDIO_API_KEY,
                model=FISH_AUDIO_MODEL,
                voice_id=FISH_AUDIO_VOICE_ID,
            )
            fa_chunks = []
            async for chunk in fa.stream_audio_chunks(test_phrase, format="mp3"):
                fa_chunks.append(chunk)
            elapsed = time.time() - t0
            fa_bytes = b"".join(fa_chunks)
            _record("Fish Audio API returns audio bytes",
                    "PASS" if len(fa_bytes) > 1000 else "FAIL",
                    f"{len(fa_bytes):,} bytes in {elapsed:.2f}s", elapsed)
            _record("Fish Audio API responds in < 20s",
                    "PASS" if elapsed < 20 else "WARN",
                    f"{elapsed:.2f}s")
        except Exception as e:
            elapsed = time.time() - t0
            _record("Fish Audio API returns audio bytes", "FAIL", str(e), elapsed)
    else:
        _record("Fish Audio API key present", "WARN", "No FISH_AUDIO_API_KEY - skipping live test.")

    _info("Testing full TTSAgent pipeline: text -> 8kHz mu-law Twilio chunks...")
    short_phrase = "Testing, one, two, three."
    t0 = time.time()
    try:
        chunks = []
        async for payload in tts.generate_audio_payloads(short_phrase):
            chunks.append(payload)
        elapsed = time.time() - t0
        _record("TTSAgent pipeline produces >= 1 Twilio payload chunk",
                "PASS" if len(chunks) >= 1 else "FAIL",
                f"{len(chunks)} chunks in {elapsed:.2f}s", elapsed)
        _record("Each payload chunk is a string (base64)",
                "PASS" if all(isinstance(c, str) for c in chunks) else "FAIL",
                f"Sample: {chunks[0][:30]}..." if chunks else "No chunks")
        _record("TTSAgent pipeline completes in < 30s",
                "PASS" if elapsed < 30 else "WARN",
                f"{elapsed:.2f}s")
    except Exception as e:
        elapsed = time.time() - t0
        _record("TTSAgent pipeline produces >= 1 Twilio payload chunk", "FAIL", str(e), elapsed)

    try:
        empty_chunks = []
        async for payload in tts.generate_audio_payloads("   "):
            empty_chunks.append(payload)
        _record("TTSAgent returns nothing for whitespace-only input",
                "PASS" if len(empty_chunks) == 0 else "FAIL",
                f"Got {len(empty_chunks)} chunks")
    except Exception as e:
        _record("TTSAgent returns nothing for whitespace-only input", "FAIL", str(e))


# =============================================================================
# AGENT 4 - Brain LLM (Groq LLaMA) Dialogue Engine
# =============================================================================
async def agent_brain(use_mock):
    _banner("Agent 4 . Brain LLM - Groq LLaMA Dialogue Engine")

    from config import GROQ_API_KEY, GROQ_LLM_MODEL
    questions = [
        "Can you briefly describe yourself and your most recent project?",
        "What is your current annual package and your expected CTC?",
        "What is your notice period, and is early joining possible?",
    ]
    criteria = [
        "Should mention name, role, and relevant project.",
        "Should mention salary in lakhs or LPA.",
        "Should mention days and joining flexibility.",
    ]

    _info("Testing LLMAgent in mock mode (deterministic)...")
    import importlib
    import config as cfg_mod
    import agents.llm_agent as llm_mod
    os.environ["USE_MOCK_AGENTS"] = "true"
    importlib.reload(cfg_mod)
    importlib.reload(llm_mod)
    from agents.llm_agent import LLMAgent as LLMMock

    llm = LLMMock(
        role="Full-Stack Engineer",
        questions=questions,
        key_criteria=criteria,
        candidate_name="Priya",
        is_scheduled=True
    )
    _record("LLMAgent (mock) initializes", "PASS" if llm is not None else "FAIL")
    _record("LLM.current_question_idx starts at 0",
            "PASS" if llm.current_question_idx == 0 else "FAIL")
    _record("LLM.conversation_history starts empty",
            "PASS" if llm.conversation_history == [] else "FAIL")
    _record("LLM.is_mock == True in mock mode",
            "PASS" if llm.is_mock else "FAIL",
            f"is_mock={llm.is_mock} (USE_MOCK_AGENTS={os.environ.get('USE_MOCK_AGENTS')})")

    t0 = time.time()
    greeting = await llm.generate_response("Hello! I am ready for the interview.")
    elapsed = time.time() - t0
    _record("LLM greeting response is a non-empty string",
            "PASS" if isinstance(greeting, str) and len(greeting) > 5 else "FAIL",
            f'"{greeting[:80]}..."', elapsed)
    _record("LLM adds user message to history",
            "PASS" if any(m["role"] == "user" for m in llm.conversation_history) else "FAIL")
    _record("LLM adds assistant reply to history",
            "PASS" if any(m["role"] == "assistant" for m in llm.conversation_history) else "FAIL")

    mock_answers = [
        "I am Priya, a backend developer with 3 years of experience in Node.js and Python.",
        "My current CTC is 12 LPA. I am targeting 16 LPA.",
        "I have a 30-day notice period and can negotiate early joining.",
        "I prefer remote or hybrid work.",
        "Thank you, looking forward to hearing from you!",
    ]
    for answer in mock_answers:
        await llm.generate_response(answer)

    _record("LLM advances through all questions in mock mode",
            "PASS" if llm.current_question_idx >= len(questions) else "WARN",
            f"question_idx={llm.current_question_idx}/{len(questions)}")

    closing = await llm.generate_response("Thank you, goodbye!")
    _record("LLM returns closing message when done",
            "PASS" if any(w in closing.lower() for w in ["thank", "goodbye", "hr team", "completed"]) else "WARN",
            f'"{closing[:80]}..."')
    _record("LLM conversation_history has > 8 messages",
            "PASS" if len(llm.conversation_history) > 8 else "WARN",
            f"{len(llm.conversation_history)} messages")

    if use_mock:
        _info("Skipping real LLM API test (--mock flag).")
        return

    _info(f"Testing real LLM via Groq ({GROQ_LLM_MODEL}) in live mode...")
    os.environ["USE_MOCK_AGENTS"] = "false"
    importlib.reload(cfg_mod)
    importlib.reload(llm_mod)
    from agents.llm_agent import LLMAgent as LLMReal
    LLMReal._groq_client = None

    llm_real = LLMReal(
        role="Full-Stack Engineer",
        questions=questions,
        key_criteria=criteria,
        candidate_name="Ravi",
        is_scheduled=True
    )
    _record("LLMAgent (real) initializes in non-mock mode",
            "PASS" if not llm_real.is_mock else "FAIL",
            f"is_mock={llm_real.is_mock}")

    t0 = time.time()
    try:
        r1 = await llm_real.generate_response("Hello, I am ready for the interview. My name is Ravi.")
        elapsed = time.time() - t0
        _record("Brain LLM (real) responds to greeting",
                "PASS" if isinstance(r1, str) and len(r1) > 10 else "FAIL",
                f'"{r1[:100]}..."', elapsed)
        _record("Brain LLM real responds in < 15s",
                "PASS" if elapsed < 15 else "WARN",
                f"{elapsed:.2f}s")
    except Exception as e:
        elapsed = time.time() - t0
        _record("Brain LLM (real) responds to greeting", "FAIL", str(e), elapsed)
        return

    t0 = time.time()
    try:
        r2 = await llm_real.generate_response(
            "I am a full-stack developer with 4 years of experience. "
            "I recently built a real-time AI interview platform using Node.js and Python."
        )
        elapsed = time.time() - t0
        _record("Brain LLM progresses interview after first answer",
                "PASS" if isinstance(r2, str) and len(r2) > 10 else "FAIL",
                f'"{r2[:100]}..."', elapsed)
    except Exception as e:
        _record("Brain LLM progresses interview after first answer", "FAIL", str(e))

    _record("Brain LLM conversation_history has >= 4 entries after 2 turns",
            "PASS" if len(llm_real.conversation_history) >= 4 else "WARN",
            f"{len(llm_real.conversation_history)} entries")

    last_reply = llm_real.conversation_history[-1]["content"] if llm_real.conversation_history else ""
    leaks_json = last_reply.strip().startswith("{") and last_reply.strip().endswith("}")
    _record("Brain LLM response is natural text, not raw JSON",
            "PASS" if not leaks_json else "FAIL",
            f"Starts with: '{last_reply[:40]}'")

    os.environ["USE_MOCK_AGENTS"] = "false"


# =============================================================================
# AGENT 5 - Ranker (Analyst) Agent
# =============================================================================
async def agent_ranker(use_mock):
    _banner("Agent 5 . Ranker - Interview Analyst Agent")

    sample_history = [
        {"role": "assistant", "content": "Hello Ravi! Let's start - tell me about yourself."},
        {"role": "user",      "content": "I am Ravi, a full-stack developer with 4 years of Node.js and React experience."},
        {"role": "assistant", "content": "What is your current CTC and expectation?"},
        {"role": "user",      "content": "Current CTC is 14 LPA. I am targeting 18 to 20 LPA."},
        {"role": "assistant", "content": "What is your notice period?"},
        {"role": "user",      "content": "My notice period is 30 days. I can negotiate early joining."},
        {"role": "assistant", "content": "Thank you, Ravi. We will get back to you soon."},
        {"role": "user",      "content": "Thank you! Looking forward to it."},
    ]
    fluency_scores = [4, 4, 5, 4, 4, 4]

    _info("Testing RankerAgent in mock mode...")
    import importlib
    import config as cfg_mod
    import agents.ranker_agent as ranker_mod
    os.environ["USE_MOCK_AGENTS"] = "true"
    importlib.reload(cfg_mod)
    importlib.reload(ranker_mod)
    from agents.ranker_agent import RankerAgent as RankerMock

    ranker = RankerMock()
    _record("RankerAgent (mock) initializes", "PASS" if ranker is not None else "FAIL")
    _record("RankerAgent is_mock == True", "PASS" if ranker.is_mock else "FAIL")

    t0 = time.time()
    score, dossier = ranker.evaluate_interview(sample_history, fluency_scores)
    elapsed = time.time() - t0
    _record("Ranker returns integer score",
            "PASS" if isinstance(score, int) else "FAIL",
            f"Score={score}", elapsed)
    _record("Ranker score is 0-100",
            "PASS" if 0 <= score <= 100 else "FAIL",
            f"Score={score}")
    _record("Dossier has 'summary'",   "PASS" if "summary"    in dossier else "FAIL")
    _record("Dossier has 'strengths'", "PASS" if "strengths"  in dossier else "FAIL")
    _record("Dossier has 'weaknesses'","PASS" if "weaknesses" in dossier else "FAIL")
    _record("Dossier has 'transcript'","PASS" if "transcript" in dossier else "FAIL")
    _record("Dossier transcript matches input",
            "PASS" if dossier.get("transcript") == sample_history else "FAIL")
    _record("Dossier strengths is a list",
            "PASS" if isinstance(dossier.get("strengths"), list) else "FAIL")

    score_empty, _ = ranker.evaluate_interview([])
    _record("Ranker handles empty history gracefully",
            "PASS" if isinstance(score_empty, int) else "FAIL",
            f"Empty score={score_empty}")

    if use_mock:
        _info("Skipping real Ranker API test (--mock flag).")
        return

    _info("Testing real RankerAgent via Groq LLM...")
    os.environ["USE_MOCK_AGENTS"] = "false"
    importlib.reload(cfg_mod)
    importlib.reload(ranker_mod)
    from agents.ranker_agent import RankerAgent as RankerReal
    RankerReal._groq_client = None

    ranker_real = RankerReal()
    _record("RankerAgent (real) is non-mock",
            "PASS" if not ranker_real.is_mock else "FAIL",
            f"is_mock={ranker_real.is_mock}")

    t0 = time.time()
    try:
        score_r, dossier_r = ranker_real.evaluate_interview(sample_history, fluency_scores)
        elapsed = time.time() - t0
        _record("Real Ranker returns integer score",
                "PASS" if isinstance(score_r, int) else "FAIL",
                f"Score={score_r}", elapsed)
        _record("Real Ranker score is 0-100",
                "PASS" if 0 <= score_r <= 100 else "FAIL",
                f"Score={score_r}")
        _record("Real Ranker dossier has summary",
                "PASS" if "summary" in dossier_r else "FAIL",
                f'Summary: "{str(dossier_r.get("summary", ""))[:80]}..."')
        _record("Real Ranker responds in < 30s",
                "PASS" if elapsed < 30 else "WARN",
                f"{elapsed:.2f}s")
        _info(f"Real Ranker score: {score_r}/100")
        _info(f"Summary: {str(dossier_r.get('summary', ''))[:100]}...")
    except Exception as e:
        elapsed = time.time() - t0
        _record("Real Ranker returns integer score", "FAIL", str(e), elapsed)

    os.environ["USE_MOCK_AGENTS"] = "false"


# =============================================================================
# AGENT 6 - Full Agentic End-to-End Pipeline
# =============================================================================
async def agent_e2e_pipeline(use_mock):
    _banner("Agent 6 . End-to-End Agentic Pipeline (STT -> Brain -> TTS -> Ranker)")

    _info("Forcing mock mode for E2E pipeline to avoid API rate limits...")
    os.environ["USE_MOCK_AGENTS"] = "true"

    import importlib
    import config as cfg_mod
    import agents.stt_agent    as stt_mod
    import agents.llm_agent    as llm_mod
    import agents.ranker_agent as ranker_mod
    importlib.reload(cfg_mod)
    for m in [stt_mod, llm_mod, ranker_mod]:
        importlib.reload(m)

    from agents.stt_agent    import STTAgent
    from agents.llm_agent    import LLMAgent
    from agents.ranker_agent import RankerAgent
    from agents.tts_agent    import TTSAgent

    stt   = STTAgent()
    brain = LLMAgent(
        role="Python Developer",
        candidate_name="AutoAgent",
        is_scheduled=True,
        questions=[
            "Tell me about your Python experience.",
            "What is your current package?",
            "What is your notice period?",
        ]
    )
    tts    = TTSAgent()
    ranker = RankerAgent()

    dummy_pcm = b"\x00" * 1600
    t0 = time.time()
    turn_count = 0
    max_turns  = 25
    tts_payloads_total = 0
    exceptions_seen = []

    _info("Starting agentic interview loop...")
    while brain.current_question_idx < len(brain.questions) and turn_count < max_turns:
        turn_count += 1
        try:
            transcript = await stt.process_audio(dummy_pcm)
            ai_reply   = await brain.generate_response(transcript)
            chunk_count = 0
            async for _ in tts.generate_audio_payloads(ai_reply):
                chunk_count += 1
                tts_payloads_total += 1
                if chunk_count >= 5:
                    break
        except Exception as e:
            exceptions_seen.append(str(e))

    elapsed = time.time() - t0
    score, dossier = ranker.evaluate_interview(brain.conversation_history, brain.fluency_scores)

    _record("E2E pipeline completed without exceptions",
            "PASS" if len(exceptions_seen) == 0 else "FAIL",
            f"{len(exceptions_seen)} exception(s): {exceptions_seen[:1]}")
    _record("E2E pipeline completed in < 60s",
            "PASS" if elapsed < 60 else "WARN",
            f"{elapsed:.2f}s", elapsed)
    _record("E2E all 3 questions covered",
            "PASS" if brain.current_question_idx >= len(brain.questions) else "WARN",
            f"question_idx={brain.current_question_idx}/{len(brain.questions)}")
    _record("E2E ranker produced valid score",
            "PASS" if 0 <= score <= 100 else "FAIL",
            f"Score={score}/100")
    _record("E2E conversation_history has >= 6 messages",
            "PASS" if len(brain.conversation_history) >= 6 else "WARN",
            f"{len(brain.conversation_history)} messages")
    _record("E2E TTS produced >= 1 audio payload",
            "PASS" if tts_payloads_total >= 1 else "FAIL",
            f"{tts_payloads_total} total chunks")

    _info(f"Pipeline: {turn_count} turns, score={score}/100, time={elapsed:.2f}s")
    _info(f"Dossier summary: {str(dossier.get('summary', ''))[:100]}")

    os.environ["USE_MOCK_AGENTS"] = "false"
    return score, dossier


# =============================================================================
# MAIN RUNNER
# =============================================================================
async def main():
    parser = argparse.ArgumentParser(description="AntiTalk Agentic Test Suite")
    parser.add_argument("--mock", action="store_true",
                        help="Run in mock mode only (no real API calls)")
    parser.add_argument("--suite", nargs="+",
                        choices=["config", "stt", "tts", "brain", "ranker", "e2e"],
                        help="Run specific test suites only")
    args = parser.parse_args()

    use_mock = args.mock
    suites   = set(args.suite) if args.suite else {"config", "stt", "tts", "brain", "ranker", "e2e"}

    if use_mock:
        os.environ["USE_MOCK_AGENTS"] = "true"
    else:
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=os.path.join(ROOT, ".env"))

    print(f"\n{BOLD}{MAGENTA}")
    print("=" * 70)
    print("    AntiTalk AI Engine - Agentic Test Suite v2.0")
    print(f"    Mode   : {'MOCK (no API calls)' if use_mock else 'REAL (live API calls)'}")
    print(f"    Suites : {', '.join(sorted(suites))}")
    print("=" * 70)
    print(RESET)

    score, dossier = None, {}

    if "config" in suites: await agent_config(use_mock)
    if "stt"    in suites: await agent_stt(use_mock)
    if "tts"    in suites: await agent_tts(use_mock)
    if "brain"  in suites: await agent_brain(use_mock)
    if "ranker" in suites: await agent_ranker(use_mock)
    if "e2e"    in suites:
        score, dossier = await agent_e2e_pipeline(use_mock)

    total = _results["passed"] + _results["failed"] + _results["warned"]
    _banner("AGENTIC TEST RESULTS SUMMARY")
    print(f"  Total Tests : {BOLD}{total}{RESET}")
    print(f"  {GREEN}Passed{RESET}      : {_results['passed']}")
    print(f"  {YELLOW}Warned{RESET}      : {_results['warned']}")
    print(f"  {RED}Failed{RESET}      : {_results['failed']}")

    failed_items = [d for d in _results["details"] if d["status"] == "FAIL"]
    warned_items = [d for d in _results["details"] if d["status"] == "WARN"]

    if failed_items:
        print(f"\n  {RED}{BOLD}Failed Tests:{RESET}")
        for d in failed_items:
            print(f"    X {d['name']}")
            if d["detail"]:
                print(f"      {DIM}-> {d['detail']}{RESET}")

    if warned_items:
        print(f"\n  {YELLOW}Warnings:{RESET}")
        for d in warned_items:
            print(f"    ! {d['name']}")
            if d["detail"]:
                print(f"      {DIM}-> {d['detail']}{RESET}")

    print()
    if _results["failed"] == 0:
        print(f"  {BOLD}{GREEN}All {total} checks passed! Pipeline is healthy.{RESET}")
    else:
        pct = int((_results["passed"] + _results["warned"]) / total * 100) if total else 0
        print(f"  {YELLOW}{pct}% checks passed. Review failed tests above.{RESET}")

    if score is not None:
        print(f"\n  {CYAN}E2E Pipeline Score : {BOLD}{score}/100{RESET}")
        print(f"  {CYAN}Dossier Summary    : {RESET}{str(dossier.get('summary', ''))[:80]}...")
        print(f"  {CYAN}Strengths          : {RESET}{dossier.get('strengths', [])}")

    print(f"\n{CYAN}{'=' * 70}{RESET}\n")
    sys.exit(0 if _results["failed"] == 0 else 1)


if __name__ == "__main__":
    asyncio.run(main())
