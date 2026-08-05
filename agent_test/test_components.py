import os
import sys
import io
import asyncio
import json

# Ensure UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

python_service_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'python_service')
if python_service_path not in sys.path:
    sys.path.append(python_service_path)

from agents.tts_agent import TTSAgent
from agents.stt_agent import STTAgent
from agents.llm_agent import LLMAgent
from agents.ranker_agent import RankerAgent

async def run_diagnostics():
    print("=" * 60)
    print("  AntiTalk AI Voice Sandbox - Comprehensive Component Test")
    print("=" * 60)
    
    # 1. Test LLM Brain Agent
    print("\n[1/4] Testing LLM Brain Agent...")
    questions = [
        "Tell me about your technical background.",
        "What is your expected CTC?",
        "What is your notice period?"
    ]
    llm = LLMAgent(candidate_name="Diagnostic User", questions=questions, is_scheduled=True)
    greeting = llm.get_initial_greeting()
    print(f"  [OK] Initial Greeting: \"{greeting[:60]}...\"")
    assert len(greeting) > 0, "Greeting is empty!"
    
    resp1 = await llm.generate_response("I have 5 years of full-stack engineering experience.")
    print(f"  [OK] User Reply 1 -> LLM Response: \"{resp1[:60]}...\"")
    assert len(resp1) > 0, "Response 1 is empty!"
    
    # 2. Test TTS Agent (Audio Payload Generation)
    print("\n[2/4] Testing TTS Agent Voice Output...")
    tts = TTSAgent()
    payload_count = 0
    total_bytes = 0
    
    async for payload in tts.generate_audio_payloads(greeting[:50]):
        payload_count += 1
        total_bytes += len(payload)
        if payload_count == 1:
            print(f"  [OK] First Audio Payload Sample (b64): {payload[:30]}...")
            
    print(f"  [OK] Total TTS Audio Chunks Generated: {payload_count}")
    assert payload_count > 0, "No TTS audio payloads generated!"
    
    # 3. Test STT Agent (Speech Transcription)
    print("\n[3/4] Testing STT Agent Transcription...")
    stt = STTAgent()
    dummy_audio = b"\x00" * 3200  # ~200ms of 8kHz 16-bit PCM silence
    transcript = await stt.process_audio(dummy_audio)
    print(f"  [OK] Transcribed Text: \"{transcript}\"")
    assert isinstance(transcript, str), "STT output is not a string!"
    
    # 4. Test Ranker Agent (Post-Call Analysis)
    print("\n[4/4] Testing Ranker Agent Dossier Generation...")
    ranker = RankerAgent()
    history = [
        {"role": "assistant", "content": greeting},
        {"role": "user", "content": "I have 5 years of full-stack engineering experience."},
        {"role": "assistant", "content": resp1},
        {"role": "user", "content": "My expected CTC is 18 LPA and my notice period is 30 days."}
    ]
    score, dossier = ranker.evaluate_interview(history)
    print(f"  [OK] Generated Candidate Score: {score}/100")
    print(f"  [OK] Dossier Summary: {dossier.get('summary', 'N/A')}")
    print(f"  [OK] Dossier Strengths: {dossier.get('strengths', [])}")
    assert 0 <= score <= 100, f"Invalid score: {score}"
    assert "summary" in dossier, "Missing summary in dossier!"

    print("\n" + "=" * 60)
    print("  [SUCCESS] ALL COMPONENT TESTS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_diagnostics())
