import asyncio
import websockets
import json
import traceback

async def test():
    uri = "ws://localhost:8001/media-stream?candidateId=BROWSER_TEST&is_scheduled=true&candidateName=Browser%20Tester"
    try:
        async with websockets.connect(uri) as ws:
            print("Connected to WebSocket.")
            start_event = {
                "event": "start",
                "streamSid": "browser_test_stream_001",
                "start": { "customParameters": { "candidateId": "BROWSER_TEST" } }
            }
            await ws.send(json.dumps(start_event))
            print("Sent start event.")
            
            # Wait for responses
            while True:
                msg = await asyncio.wait_for(ws.recv(), timeout=15.0)
                data = json.loads(msg)
                event = data.get("event")
                if event == "media":
                    payload = data.get("media", {}).get("payload", "")
                    print(f"Received media event. Payload length: {len(payload)}")
                    break
                else:
                    print(f"Received other event: {event}")
    except Exception as e:
        print(f"Error: {repr(e)}")
        traceback.print_exc()

asyncio.run(test())
