import requests
import logging
from config import EXPRESS_WEBHOOK_URL

logger = logging.getLogger(__name__)

def post_call_results(candidate_id: str, ai_score: int, dossier_json: dict):
    """
    Sends the generated AI score and dossier back to the Express backend.
    """
    if not candidate_id:
        logger.error("No candidate_id provided. Cannot post webhook.")
        return False

    payload = {
        "candidate_id": candidate_id,
        "ai_score": ai_score,
        "dossier_json": dossier_json
    }

    try:
        response = requests.post(EXPRESS_WEBHOOK_URL, json=payload, timeout=10)
        response.raise_for_status()
        logger.info(f"Successfully posted results for candidate {candidate_id}")
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to post results to webhook: {e}")
        return False
