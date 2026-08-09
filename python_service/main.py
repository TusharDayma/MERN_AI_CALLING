import uvicorn
import logging
from fastapi import FastAPI
from core.config import PORT
from api.routers.media_stream import router as media_stream_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AntiTalk Modular AI Voice Engine")

# Mount Media Stream Router
app.include_router(media_stream_router)

from utils.telemetry import get_telemetry_metrics

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "AntiTalk Modular Python AI Engine",
        "websocket": "/media-stream"
    }

@app.get("/metrics")
async def metrics():
    return get_telemetry_metrics()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
