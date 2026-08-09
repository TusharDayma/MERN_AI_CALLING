import os
import sys
import io
import asyncio
import json
import websockets
import ssl

# Ensure UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

async def test_websocket_server():
    uri = "ws://localhost:8005/media-stream?candidateId=SANDBOX_TEST&is_scheduled=true&candidateName=Test%20User"
    print(f"[+] Connecting to WebSocket server at {uri}...")
    
    try:
        ssl_context = ssl._create_unverified_context() if uri.startswith("wss") else None
        async with websockets.connect(uri, ssl=ssl_context) as ws:
            print("  [OK] WebSocket connection opened successfully!")
            
            # Send initial start event
            start_payload = {
                "event": "start",
                "streamSid": "sandbox_stream_test_001",
                "start": { "customParameters": { "candidateId": "SANDBOX_TEST" } }
            }
            await ws.send(json.dumps(start_payload))
            print("  [OK] Sent 'start' event to server.")
            
            received_media = 0
            received_logs = 0
            
            # Listen for initial AI greeting audio payloads and log events (wait up to 10 seconds for TTS audio stream)
            start_time = asyncio.get_event_loop().time()
            while asyncio.get_event_loop().time() - start_time < 10.0:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=2.0)
                    data = json.loads(msg)
                    event_type = data.get("event")
                    if event_type == "media":
                        received_media += 1
                    elif event_type == "log":
                        received_logs += 1
                        print(f"  [Server Log] {data.get('message')}")
                except asyncio.TimeoutError:
                    if received_media > 0:
                        break
                    
            print(f"  [OK] Received {received_media} TTS media audio chunks and {received_logs} server log events.")
            assert received_media > 0, "Expected at least 1 TTS audio media payload!"
            print("\n  [SUCCESS] WebSocket Server integration test PASSED PERFECTLY!")
            
    except Exception as err:
        print(f"  [ERR] WebSocket connection error: {err}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_websocket_server())
