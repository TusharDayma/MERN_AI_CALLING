from fastapi import APIRouter, WebSocket
from services.interview_orchestrator import handle_interview_stream

router = APIRouter()

@router.websocket("/media-stream")
async def media_stream_endpoint(websocket: WebSocket):
    await handle_interview_stream(websocket)
