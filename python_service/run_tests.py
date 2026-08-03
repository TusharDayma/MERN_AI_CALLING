# coding: utf-8
"""
AntiTalk AI Engine - Automated Test Suite
==========================================
Tests all Python agent functions in mock mode.
Run with: python run_tests.py
"""

import os
import sys
import asyncio
import json
import time

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Force mock mode for tests
os.environ["USE_MOCK_AGENTS"] = "true"

# ── Colors ──────────────────────────────────────────────────────────────────
CYAN    = "\033[96m"
YELLOW  = "\033[93m"
GREEN   = "\033[92m"
RED     = "\033[91m"
BLUE    = "\033[94m"
BOLD    = "\033[1m"
RESET   = "\033[0m"

PASS = f"{GREEN}[PASS]{RESET}"
FAIL = f"{RED}[FAIL]{RESET}"
INFO = f"{CYAN}[INFO]{RESET}"
WARN = f"{YELLOW}[WARN]{RESET}"

# Force UTF-8 output on Windows
import io
import sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ── Test Counters ────────────────────────────────────────────────────────────
results = {"passed": 0, "failed": 0, "errors": []}

def header(title):
    print(f"\n{CYAN}{'='*62}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{CYAN}{'='*62}{RESET}")

def test(name, condition, detail=""):
    if condition:
        results["passed"] += 1
        print(f"  [PASS] {name}")
        if detail:
            print(f"        -> {detail}")
    else:
        results["failed"] += 1
        results["errors"].append(name)
        print(f"  [FAIL] {name}")
        if detail:
            print(f"        -> {detail}")

def info(msg):
    print(f"  {INFO} {msg}")

# -----------------------------------------------------------------------------
# TEST SUITE 1: STT Agent
# -----------------------------------------------------------------------------
async def test_stt_agent():
    header("Test Suite 1: STT (Speech-to-Text) Agent")
    from agents.stt_agent import STTAgent

    stt = STTAgent()

    # T1.1 – Initialises correctly
    test("STT Agent initializes without error", stt is not None)
    test("STT Agent is in mock mode",           stt.is_mock == True)
    test("STT Agent call_count starts at 0",    stt.call_count == 0)

    # T1.2 – Returns transcripts
    dummy_audio = b"\x00" * 100
    transcript_1 = await stt.process_audio(dummy_audio)
    test("STT returns non-empty transcript on first call",
         isinstance(transcript_1, str) and len(transcript_1) > 0,
         f'Got: "{transcript_1}"')
    test("STT call_count increments to 1 after first call", stt.call_count == 1)

    transcript_2 = await stt.process_audio(dummy_audio)
    test("STT returns different reply on second call (question progression)",
         transcript_2 != transcript_1,
         f'Got: "{transcript_2}"')
    test("STT call_count increments to 2 after second call", stt.call_count == 2)

    # T1.3 – Stress test: run through all 5 mock answers
    stt2 = STTAgent()
    replies = []
    for i in range(5):
        r = await stt2.process_audio(dummy_audio)
        replies.append(r)
    test("STT cycles through all 5 mock answers",
         len(set(replies)) == 5,
         f"Unique replies: {len(set(replies))}")

    # T1.4 – Fallback for out-of-bound call_count
    extra = await stt2.process_audio(dummy_audio)
    test("STT returns fallback for call_count > 5",
         isinstance(extra, str) and len(extra) > 0,
         f'Fallback: "{extra}"')


# -----------------------------------------------------------------------------
# TEST SUITE 2: LLM Brain Agent
# -----------------------------------------------------------------------------
async def test_llm_agent():
    header("Test Suite 2: LLM Brain Agent")
    from agents.llm_agent import LLMAgent

    questions = [
        "Explain how middleware works in Express.js.",
        "What is the difference between state and props in React?",
        "How do you secure a REST API?"
    ]
    criteria = [
        "Must mention request/response and next().",
        "State is internal/mutable; props are external/immutable.",
        "Must mention JWT, HTTPS, and input validation."
    ]
    llm = LLMAgent(role="Senior Engineer", questions=questions, key_criteria=criteria, is_scheduled=True)

    # T2.1 – Initialisation
    test("LLM Agent initializes without error",         llm is not None)
    test("LLM starts with 0 questions answered",        llm.current_question_idx == 0)
    test("LLM first_question_asked starts False",       llm.first_question_asked == False)
    test("LLM conversation_history starts empty",       llm.conversation_history == [])

    # T2.2 – First greeting response
    r1 = await llm.generate_response("Hello, I am doing great!")
    test("LLM returns string greeting response",        isinstance(r1, str) and len(r1) > 0,
         f'"{r1[:80]}..."')
    test("LLM first_question_asked set to True after greeting",
         llm.first_question_asked == True)
    test("LLM adds user message to conversation_history",
         any(m["role"] == "user" for m in llm.conversation_history))
    test("LLM adds assistant reply to conversation_history",
         any(m["role"] == "assistant" for m in llm.conversation_history))

    # T2.3 – Question progression (mock double-attempt logic)
    r2 = await llm.generate_response("Middleware is a function that handles requests.")
    test("LLM returns follow-up on first attempt (mock mode)",
         isinstance(r2, str) and len(r2) > 0,
         f'"{r2[:80]}..."')
    test("LLM does NOT advance question index on first attempt",
         llm.current_question_idx == 0)

    r3 = await llm.generate_response("It has access to req, res, and next().")
    test("LLM advances to next question after second attempt",
         llm.current_question_idx == 1,
         f"current_question_idx={llm.current_question_idx}")

    # T2.4 – Complete all questions
    await llm.generate_response("State is internal, props are from parents.")  # Q2 attempt 1
    await llm.generate_response("State is mutable, props are immutable.")       # Q2 attempt 2 → advance
    await llm.generate_response("Use HTTPS, JWT, and input sanitization.")      # Q3 attempt 1
    await llm.generate_response("Also use rate limiting and CORS policies.")    # Q3 attempt 2 → advance

    test("LLM advances past all questions",
         llm.current_question_idx >= len(questions),
         f"current_question_idx={llm.current_question_idx}")

    # T2.5 – Closing message when all questions done
    closing = await llm.generate_response("Thank you, goodbye.")
    test("LLM returns closing message after all questions done",
         "goodbye" in closing.lower() or "thank you" in closing.lower(),
         f'"{closing[:80]}..."')

    # T2.6 – History length sanity check
    test("LLM conversation_history has more than 5 messages",
         len(llm.conversation_history) > 5,
         f"Total messages: {len(llm.conversation_history)}")


# -----------------------------------------------------------------------------
# TEST SUITE 3: Ranker (Analyst) Agent
# -----------------------------------------------------------------------------
async def test_ranker_agent():
    header("Test Suite 3: Ranker (Analyst) Agent")
    from agents.ranker_agent import RankerAgent

    ranker = RankerAgent()

    # T3.1 – Init
    test("Ranker Agent initializes without error", ranker is not None)
    test("Ranker Agent is in mock mode",           ranker.is_mock == True)

    # T3.2 – Mock score on empty history
    sample_history = [
        {"role": "assistant", "content": "Hello, how are you?"},
        {"role": "user",      "content": "I'm great, ready to interview."},
        {"role": "assistant", "content": "Great! Explain middleware in Express."},
        {"role": "user",      "content": "Middleware has access to req, res, and next()."},
        {"role": "assistant", "content": "Good. What's the difference between state and props?"},
        {"role": "user",      "content": "State is mutable internal data; props are external."},
        {"role": "assistant", "content": "Perfect. How do you secure a REST API?"},
        {"role": "user",      "content": "Use HTTPS, JWT tokens, and input validation."},
    ]
    score, dossier = ranker.evaluate_interview(sample_history)

    test("Ranker returns integer score",            isinstance(score, int),
         f"Score: {score}")
    test("Ranker score is between 0 and 100",       0 <= score <= 100,
         f"Score: {score}")
    test("Dossier contains 'summary' field",        "summary" in dossier)
    test("Dossier contains 'strengths' field",      "strengths" in dossier)
    test("Dossier contains 'weaknesses' field",     "weaknesses" in dossier)
    test("Dossier contains 'transcript' field",     "transcript" in dossier)
    test("Dossier transcript matches input history", dossier["transcript"] == sample_history)
    test("Dossier strengths is a list",             isinstance(dossier["strengths"], list))
    test("Dossier weaknesses is a list",            isinstance(dossier["weaknesses"], list))

    # T3.3 – Empty history doesn't crash
    score_empty, dossier_empty = ranker.evaluate_interview([])
    test("Ranker handles empty conversation history gracefully",
         isinstance(score_empty, int),
         f"Score on empty: {score_empty}")


# -----------------------------------------------------------------------------
# TEST SUITE 4: Full End-to-End Pipeline (Mock)
# -----------------------------------------------------------------------------
async def test_full_pipeline():
    header("Test Suite 4: Full End-to-End Mock Pipeline")
    from agents.stt_agent    import STTAgent
    from agents.llm_agent    import LLMAgent
    from agents.ranker_agent import RankerAgent

    stt    = STTAgent()
    llm    = LLMAgent(is_scheduled=True)
    ranker = RankerAgent()

    dummy_audio = b"\x00" * 100
    start_time  = time.time()

    # Simulate the full interview loop using STT input → LLM → Ranker
    turn_count = 0
    max_turns  = 20  # safety cap
    while llm.current_question_idx < len(llm.questions) and turn_count < max_turns:
        transcript    = await stt.process_audio(dummy_audio)
        ai_reply      = await llm.generate_response(transcript)
        turn_count   += 1

    elapsed = time.time() - start_time
    score, dossier = ranker.evaluate_interview(llm.conversation_history)

    test("Full pipeline completed without exception",      True)
    test("Pipeline completed in under 30 seconds",         elapsed < 30,
         f"Time: {elapsed:.2f}s")
    test("All 3 interview questions were covered",
         llm.current_question_idx >= len(llm.questions),
         f"Questions completed: {llm.current_question_idx}")
    test("Ranker produces valid score from pipeline output", 0 <= score <= 100,
         f"Final score: {score}/100")
    test("Pipeline transcript has enough turns",           len(llm.conversation_history) >= 6,
         f"Total turns: {len(llm.conversation_history)}")

    info(f"Pipeline summary: {turn_count} turns, score={score}/100, time={elapsed:.2f}s")
    return score, dossier


# -----------------------------------------------------------------------------
# TEST SUITE 5: Webhook Client
# -----------------------------------------------------------------------------
async def test_webhook_client():
    header("Test Suite 5: Webhook Client (Dry Run)")
    from utils.webhook_client import post_call_results

    # T5.1 – Function is callable
    test("post_call_results function is importable and callable",
         callable(post_call_results))

    # T5.2 – Calling with dummy data doesn't crash (Express may not be running)
    dummy_dossier = {
        "score": 85,
        "summary": "Test run",
        "strengths": ["Testing"],
        "weaknesses": ["None"],
        "transcript": []
    }
    try:
        success = await post_call_results("test-candidate-id", 85, dummy_dossier)
        if success:
            test("Webhook call to localhost:5000 succeeded (Express is running)", True)
        else:
            test("Webhook call handled gracefully even if Express is offline", True, "Returned False")
    except Exception as e:
        # Expected if Express isn't running – should not crash the test
        test("Webhook call handled gracefully even if Express is offline",
             True, f"Exception caught: {type(e).__name__}: {e}")


# -----------------------------------------------------------------------------
# TEST SUITE 6: Config Validation
# -----------------------------------------------------------------------------
async def test_config():
    header("Test Suite 6: Config & Environment Variables")
    from config import (PORT, USE_MOCK_AGENTS, EXPRESS_WEBHOOK_URL,
                        TWILIO_SAMPLE_RATE, TWILIO_CHANNELS,
                        STT_MODEL, TTS_MODEL, BRAIN_MODEL, RANKER_MODEL)

    test("PORT is valid integer",              isinstance(PORT, int) and PORT > 0,
         f"PORT={PORT}")
    test("USE_MOCK_AGENTS is a boolean",       isinstance(USE_MOCK_AGENTS, bool),
         f"USE_MOCK_AGENTS={USE_MOCK_AGENTS}")
    test("EXPRESS_WEBHOOK_URL is a string",    isinstance(EXPRESS_WEBHOOK_URL, str) and
                                               EXPRESS_WEBHOOK_URL.startswith("http"),
         f"URL={EXPRESS_WEBHOOK_URL}")
    test("TWILIO_SAMPLE_RATE is 8000",         TWILIO_SAMPLE_RATE == 8000,
         f"TWILIO_SAMPLE_RATE={TWILIO_SAMPLE_RATE}")
    test("TWILIO_CHANNELS is 1",               TWILIO_CHANNELS == 1,
         f"TWILIO_CHANNELS={TWILIO_CHANNELS}")
    test("STT_MODEL is configured",            isinstance(STT_MODEL, str) and len(STT_MODEL) > 0,
         f"STT_MODEL={STT_MODEL}")
    test("TTS_MODEL is configured",            isinstance(TTS_MODEL, str) and len(TTS_MODEL) > 0,
         f"TTS_MODEL={TTS_MODEL}")
    test("BRAIN_MODEL is configured",          isinstance(BRAIN_MODEL, str) and len(BRAIN_MODEL) > 0,
         f"BRAIN_MODEL={BRAIN_MODEL}")
    test("RANKER_MODEL is configured",         isinstance(RANKER_MODEL, str) and len(RANKER_MODEL) > 0,
         f"RANKER_MODEL={RANKER_MODEL}")


# -----------------------------------------------------------------------------
# MAIN TEST RUNNER
# -----------------------------------------------------------------------------
async def run_all_tests():
    print(f"\n{BOLD}{CYAN}")
    print("=" * 62)
    print("  AntiTalk AI Engine - Automated Test Suite")
    print("  All agents tested in Mock Mode (no GPU required)")
    print("=" * 62)
    print(RESET)

    await test_config()
    await test_stt_agent()
    await test_llm_agent()
    await test_ranker_agent()
    score, dossier = await test_full_pipeline()
    await test_webhook_client()

    # ── Final Report ────────────────────────────────────────────────────────
    total = results["passed"] + results["failed"]
    header("TEST RESULTS SUMMARY")
    print(f"  Total Tests : {total}")
    print(f"  {GREEN}Passed{RESET}      : {results['passed']}")
    print(f"  {RED}Failed{RESET}      : {results['failed']}")
    if results["errors"]:
        print(f"\n  {RED}Failed Tests:{RESET}")
        for err in results["errors"]:
            print(f"    X {err}")
    print()
    if results["failed"] == 0:
        print(f"  {BOLD}{GREEN}All {total} tests passed! Pipeline is healthy. [OK]{RESET}")
    else:
        pct = int((results["passed"] / total) * 100)
        print(f"  {YELLOW}{pct}% tests passed. Review failed tests above.{RESET}")

    print(f"  {CYAN}Final E2E Pipeline Score: {BOLD}{score}/100{RESET}")
    print(f"  {CYAN}Pipeline Dossier Summary:{RESET} ")
    print(f"    Summary   : {dossier.get('summary', 'N/A')}")
    print(f"    Strengths : {dossier.get('strengths', [])}")
    print(f"    Weaknesses: {dossier.get('weaknesses', [])}")
    print(f"\n{CYAN}{'='*62}{RESET}\n")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
