import time

# Global Telemetry State
_start_time = time.time()
_active_streams = 0
_tts_latencies = []

def increment_active_streams():
    global _active_streams
    _active_streams += 1

def decrement_active_streams():
    global _active_streams
    _active_streams = max(0, _active_streams - 1)

def record_tts_latency(latency_ms: float):
    global _tts_latencies
    _tts_latencies.append(latency_ms)
    # Keep only the last 50 latencies for a rolling average
    if len(_tts_latencies) > 50:
        _tts_latencies.pop(0)

def get_telemetry_metrics():
    uptime_seconds = int(time.time() - _start_time)
    avg_tts = sum(_tts_latencies) / len(_tts_latencies) if _tts_latencies else 0
    return {
        "uptime_seconds": uptime_seconds,
        "active_streams": _active_streams,
        "avg_tts_latency_ms": round(avg_tts, 2)
    }
