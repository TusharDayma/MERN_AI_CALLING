import asyncio
import edge_tts

async def test():
    try:
        print("Testing edge-tts...")
        c = edge_tts.Communicate("Hello! I am your AI recruiter. This is a test.", "en-US-JennyNeural")
        await c.save("test_tts_output.mp3")
        print("SUCCESS: test_tts_output.mp3 created!")
    except Exception as e:
        print(f"FAILED: {e}")

asyncio.run(test())
