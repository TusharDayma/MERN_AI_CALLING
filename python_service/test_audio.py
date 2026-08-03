import asyncio
from agents.tts_agent import TTSAgent
import base64
import audioop

async def main():
    agent = TTSAgent()
    payloads = []
    async for p in agent.generate_audio_payloads("Hello, this is a test of the text to speech engine. Can you hear me?"):
        payloads.append(p)
    
    # decode all base64 payloads to mulaw bytes
    mulaw = b"".join(base64.b64decode(p) for p in payloads)
    print(f"Total chunks: {len(payloads)}")
    print(f"Total mulaw bytes: {len(mulaw)}")
    
    pcm = audioop.ulaw2lin(mulaw, 2)
    rms = audioop.rms(pcm, 2)
    print(f"RMS Energy of generated audio: {rms}")
    if rms < 100:
        print("WARNING: Audio seems completely SILENT!")
    else:
        print("SUCCESS: Audio has normal energy levels.")

asyncio.run(main())
