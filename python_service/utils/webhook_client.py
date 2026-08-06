import requests
import logging
import asyncio
from config import EXPRESS_WEBHOOK_URL

logger = logging.getLogger(__name__)

async def post_call_results(candidate_id: str, ai_score: int, dossier_json: dict, status: str = "COMPLETED"):
    """
    Sends the generated AI score, dossier, and status back to the Express backend.
    """
    if not candidate_id:
        logger.error("No candidate_id provided. Cannot post webhook.")
        return False

    payload = {
        "candidate_id": candidate_id,
        "ai_score": ai_score,
        "dossier_json": dossier_json,
        "status": status
    }

    try:
        import os
        INTERNAL_WEBHOOK_SECRET = os.getenv("INTERNAL_WEBHOOK_SECRET", "super_secure_internal_secret_123")
        headers = {
            "Content-Type": "application/json",
            "X-Internal-Webhook-Secret": INTERNAL_WEBHOOK_SECRET
        }

        def _post():
            response = requests.post(EXPRESS_WEBHOOK_URL, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            return response

        await asyncio.to_thread(_post)
        logger.info(f"Successfully posted results for candidate {candidate_id} (Status: {status})")
        return True
    except Exception as e:
        logger.error(f"Failed to post results to webhook: {e}")
        return False
