import asyncio
from agents.tts_agent import TTSAgent

async def test():
    print("Testing TTSAgent pipeline...")
    agent = TTSAgent()
    payloads = []
    async for p in agent.generate_audio_payloads("hello world"):
        payloads.append(p)
    print(f"SUCCESS: Generated {len(payloads)} audio payloads.")

if __name__ == "__main__":
    asyncio.run(test())
