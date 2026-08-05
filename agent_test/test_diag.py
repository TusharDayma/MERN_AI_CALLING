import os, sys, asyncio

python_service_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'python_service')
if python_service_path not in sys.path:
    sys.path.append(python_service_path)

from agents.tts_agent import TTSAgent
from agents.llm_agent import LLMAgent

async def diag():
    print("[Diag] Initializing LLM and TTS agents...")
    llm = LLMAgent(candidate_name="Tester", is_scheduled=True)
    tts = TTSAgent()
    
    greeting = llm.get_initial_greeting()
    print(f"[Diag] Greeting: '{greeting[:40]}...'")
    
    count = 0
    async for payload in tts.generate_audio_payloads(greeting):
        count += 1
        if count == 1:
            print(f"[Diag] Payload #1: {payload[:40]}...")
            
    print(f"[Diag] Total payloads generated: {count}")

if __name__ == "__main__":
    asyncio.run(diag())
