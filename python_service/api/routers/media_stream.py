from fastapi import APIRouter, WebSocket
from services.interview_orchestrator import handle_interview_stream
from utils.telemetry import increment_active_streams, decrement_active_streams

router = APIRouter()

@router.websocket("/media-stream")
async def media_stream_endpoint(websocket: WebSocket):
    increment_active_streams()
    try:
        await handle_interview_stream(websocket)
    finally:
        decrement_active_streams()
