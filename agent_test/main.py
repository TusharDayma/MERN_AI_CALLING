import os
import sys
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse

# Ensure python_service is in sys.path to import agents and services
python_service_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'python_service')
if python_service_path not in sys.path:
    sys.path.append(python_service_path)

from services.interview_orchestrator import handle_interview_stream

app = FastAPI(title="AntiTalk AI Voice Sandbox")

@app.get("/")
async def serve_sandbox():
    index_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

@app.websocket("/media-stream")
async def media_stream_endpoint(websocket: WebSocket):
    await handle_interview_stream(websocket)

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await handle_interview_stream(websocket)

if __name__ == "__main__":
    port_env = os.getenv("AGENT_TEST_PORT") or os.getenv("PORT")
    port = int(port_env) if port_env and port_env != "8000" else 8005
    print(f"[+] Starting AntiTalk AI Voice Sandbox on http://localhost:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
