"""
Fish Audio S2.1 Pro Text-to-Speech (TTS) Integration Service
============================================================
Provides production-ready integration with Fish Audio's state-of-the-art
S2.1 Pro model using the free API tier (`s2.1-pro-free`).

Features:
  - Synchronous synthesis directly to disk (file generation)
  - Real-time async streaming (~90ms TTFA) yielding raw audio byte chunks
  - Inline direction tags support ([whispering], [excited], [laughing], [emphasis])
  - Multilingual synthesis (83 languages) & Voice Cloning (reference_id)
  - Exponential backoff & retry handler for HTTP 429 (Rate Limit) errors
"""

import os
import sys
import time
import asyncio
import logging
from typing import AsyncGenerator, Optional
import httpx

logger = logging.getLogger(__name__)

# Default Fish Audio API configuration
FISH_AUDIO_API_URL = "https://api.fish.audio/v1/tts"
DEFAULT_MODEL = "s2.1-pro-free"


class FishAudioTTSError(Exception):
    """Custom exception for Fish Audio TTS errors."""
    pass


class FishAudioRateLimitError(FishAudioTTSError):
    """Raised when Fish Audio API returns HTTP 429 Rate Limit."""
    pass


class FishAudioTTS:
    """
    Client for Fish Audio S2.1 Pro Text-to-Speech API.
    Supports free tier (`s2.1-pro-free`) and custom cloned voices via `reference_id`.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        voice_id: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        max_retries: int = 3,
        base_retry_delay: float = 1.0,
    ):
        self.api_key = api_key or os.getenv("FISH_AUDIO_API_KEY", "")
        self.voice_id = voice_id or os.getenv("FISH_AUDIO_VOICE_ID", "")
        self.model = model or os.getenv("FISH_AUDIO_MODEL", DEFAULT_MODEL)
        self.max_retries = max_retries
        self.base_retry_delay = base_retry_delay

        if not self.api_key:
            logger.warning(
                "[FishAudioTTS] FISH_AUDIO_API_KEY is not configured. "
                "Calls will require api_key or will fall back."
            )

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "model": self.model,
            "Content-Type": "application/json",
        }

    def _build_payload(
        self,
        text: str,
        reference_id: Optional[str] = None,
        format: str = "mp3"
    ) -> dict:
        """
        Constructs request body for Fish Audio TTS API.
        Preserves inline direction tags like [whispering], [excited], [laughing], [emphasis].
        """
        # Preserve text including bracketed emotional/delivery direction tags
        processed_text = text.strip()
        target_voice = reference_id if reference_id is not None else self.voice_id

        payload = {
            "text": processed_text,
            "format": format,
        }
        if target_voice:
            payload["reference_id"] = target_voice

        return payload

    def generate_audio_file(
        self,
        text: str,
        output_path: str,
        reference_id: Optional[str] = None,
        format: str = "mp3",
    ) -> str:
        """
        Synchronous function to synthesize text and save audio directly to disk.
        Handles HTTP 429 rate limit retries with exponential backoff.
        """
        if not self.api_key:
            raise FishAudioTTSError("FISH_AUDIO_API_KEY environment variable or parameter is missing.")

        headers = self._get_headers()
        payload = self._build_payload(text, reference_id=reference_id, format=format)

        for attempt in range(1, self.max_retries + 1):
            try:
                with httpx.Client(timeout=30.0, verify=False) as client:
                    response = client.post(
                        FISH_AUDIO_API_URL,
                        headers=headers,
                        json=payload,
                    )

                    if response.status_code == 429:
                        delay = self.base_retry_delay * (2 ** (attempt - 1))
                        logger.warning(
                            f"[FishAudioTTS] HTTP 429 Rate Limit (attempt {attempt}/{self.max_retries}). "
                            f"Retrying in {delay:.1f}s..."
                        )
                        time.sleep(delay)
                        continue

                    response.raise_for_status()

                    # Save audio content to file
                    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
                    with open(output_path, "wb") as f:
                        f.write(response.content)

                    logger.info(
                        f"[FishAudioTTS] Audio synthesized & saved to {output_path} ({len(response.content)} bytes)"
                    )
                    return output_path

            except httpx.HTTPStatusError as e:
                logger.error(f"[FishAudioTTS] HTTP Status Error {e.response.status_code}: {e.response.text}")
                if attempt == self.max_retries:
                    raise FishAudioTTSError(f"HTTP error {e.response.status_code}: {e.response.text}") from e
            except Exception as e:
                logger.error(f"[FishAudioTTS] Request error on attempt {attempt}: {e}")
                if attempt == self.max_retries:
                    raise FishAudioTTSError(f"Failed to generate audio file: {e}") from e

        raise FishAudioRateLimitError("Exceeded maximum retries due to HTTP 429 Rate Limits.")

    async def stream_audio_chunks(
        self,
        text: str,
        reference_id: Optional[str] = None,
        format: str = "mp3",
        chunk_size: int = 1024,
    ) -> AsyncGenerator[bytes, None]:
        """
        Async generator function streaming raw audio byte chunks from Fish Audio API.
        Enables real-time playback with ~90ms Time-to-First-Audio (TTFA).
        Includes exponential backoff retry for HTTP 429 rate limits.
        """
        if not self.api_key:
            raise FishAudioTTSError("FISH_AUDIO_API_KEY environment variable or parameter is missing.")

        headers = self._get_headers()
        payload = self._build_payload(text, reference_id=reference_id, format=format)

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
                    async with client.stream(
                        "POST",
                        FISH_AUDIO_API_URL,
                        headers=headers,
                        json=payload,
                    ) as response:
                        if response.status_code == 429:
                            delay = self.base_retry_delay * (2 ** (attempt - 1))
                            logger.warning(
                                f"[FishAudioTTS] Stream HTTP 429 Rate Limit (attempt {attempt}/{self.max_retries}). "
                                f"Retrying in {delay:.1f}s..."
                            )
                            await asyncio.sleep(delay)
                            continue

                        response.raise_for_status()

                        logger.info(
                            f"[FishAudioTTS] Streaming audio from S2.1 Pro for text: '{text[:40]}...'"
                        )

                        async for chunk in response.aiter_bytes(chunk_size=chunk_size):
                            if chunk:
                                yield chunk
                        return  # Successfully finished streaming

            except httpx.HTTPStatusError as e:
                logger.error(f"[FishAudioTTS] Stream HTTP Error {e.response.status_code}: {e.response.text}")
                if attempt == self.max_retries:
                    raise FishAudioTTSError(f"HTTP error {e.response.status_code}: {e.response.text}") from e
            except Exception as e:
                logger.error(f"[FishAudioTTS] Stream error on attempt {attempt}: {e}")
                if attempt == self.max_retries:
                    raise FishAudioTTSError(f"Failed to stream audio: {e}") from e

        raise FishAudioRateLimitError("Exceeded maximum retries due to HTTP 429 Rate Limits.")
