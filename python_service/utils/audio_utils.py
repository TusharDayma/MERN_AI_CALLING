import base64
import audioop

def decode_twilio_payload(base64_payload: str) -> bytes:
    """Decodes Twilio base64 mulaw payload into raw bytes."""
    return base64.b64decode(base64_payload)

def encode_twilio_payload(mulaw_bytes: bytes) -> str:
    """Encodes raw mulaw bytes into Twilio base64 payload."""
    return base64.b64encode(mulaw_bytes).decode('utf-8')

def mulaw_to_pcm16(mulaw_bytes: bytes) -> bytes:
    """Convert mu-law to 16-bit PCM."""
    return audioop.ulaw2lin(mulaw_bytes, 2)

def pcm16_to_mulaw(pcm_bytes: bytes) -> bytes:
    """Convert 16-bit PCM to mu-law."""
    return audioop.lin2ulaw(pcm_bytes, 2)

def compute_rms(mulaw_bytes: bytes) -> float:
    """
    Compute RMS (root-mean-square) energy of a mulaw audio chunk.
    Converts to PCM16 first for accurate energy measurement.
    Used for Voice Activity Detection (VAD) / silence detection.
    Returns a float; typical silence < 300, speech > 400.
    """
    try:
        pcm_bytes = audioop.ulaw2lin(mulaw_bytes, 2)
        return float(audioop.rms(pcm_bytes, 2))
    except Exception:
        return 0.0
