import base64
import audioop

def decode_twilio_payload(base64_payload: str) -> bytes:
    """Decodes Twilio base64 mulaw payload into raw mulaw bytes."""
    return base64.b64decode(base64_payload)

def decode_twilio_payload_to_pcm16(base64_payload: str) -> bytes:
    """Decodes Twilio base64 mulaw payload into 16-bit linear PCM (8kHz) bytes."""
    mulaw_bytes = base64.b64decode(base64_payload)
    return audioop.ulaw2lin(mulaw_bytes, 2)

def encode_twilio_payload(mulaw_bytes: bytes) -> str:
    """Encodes raw mulaw bytes into Twilio base64 payload."""
    return base64.b64encode(mulaw_bytes).decode('utf-8')

def mulaw_to_pcm16(mulaw_bytes: bytes) -> bytes:
    """Convert mu-law to 16-bit PCM (8kHz)."""
    return audioop.ulaw2lin(mulaw_bytes, 2)

def pcm16_to_mulaw(pcm_bytes: bytes) -> bytes:
    """Convert 16-bit PCM to mu-law."""
    return audioop.lin2ulaw(pcm_bytes, 2)

def resample_pcm8k_to_pcm16k(pcm8k_bytes: bytes) -> bytes:
    """Resample 8kHz 16-bit PCM audio to 16kHz 16-bit PCM for optimal Whisper STT accuracy."""
    if not pcm8k_bytes:
        return b""
    try:
        resampled_bytes, _ = audioop.ratecv(pcm8k_bytes, 2, 1, 8000, 16000, None)
        return resampled_bytes
    except Exception:
        return pcm8k_bytes

def compute_rms(mulaw_bytes: bytes) -> float:
    """
    Compute RMS energy of a mulaw audio chunk.
    Converts to PCM16 first for accurate energy measurement.
    """
    try:
        pcm_bytes = audioop.ulaw2lin(mulaw_bytes, 2)
        return float(audioop.rms(pcm_bytes, 2))
    except Exception:
        return 0.0

def compute_rms_pcm(pcm_bytes: bytes) -> float:
    """Compute RMS energy directly on 16-bit PCM audio chunk."""
    try:
        return float(audioop.rms(pcm_bytes, 2))
    except Exception:
        return 0.0

