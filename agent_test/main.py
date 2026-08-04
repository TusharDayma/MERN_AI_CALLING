import os
import sys
import asyncio
import json
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

# Add python_service to sys.path to import agents and orchestrator
python_service_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'python_service')
if python_service_path not in sys.path:
    sys.path.append(python_service_path)

from services.interview_orchestrator import handle_interview_stream

app = FastAPI(title="AntiTalk Agent Voice & Speech Sandbox")

@app.get("/")
async def get():
    with open(os.path.join(os.path.dirname(__file__), "index.html"), "r", encoding="utf-8") as f:
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
    print(f"Starting Agent Test Sandbox on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)

