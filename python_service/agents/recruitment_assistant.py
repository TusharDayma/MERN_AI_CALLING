import logging
from agents.llm_agent import LLMAgent

logger = logging.getLogger(__name__)

class RecruitmentAssistant:
    """
    High-level Recruitment Assistant wrapper orchestrating candidate outreach,
    scheduling, and voice screenings according to HR operational rules.
    """
    def __init__(
        self,
        candidate_name: str,
        campaign_brief: str,
        scheduling_link: str,
        hr_deadline_days: int = 3,
        current_channel: str = "Voice",
        is_scheduled: bool = False,
        has_whatsapp_replied: bool = False,
        questions: list = None,
        key_criteria: list = None
    ):
        self.agent = LLMAgent(
            candidate_name=candidate_name,
            campaign_brief=campaign_brief,
            scheduling_link=scheduling_link,
            hr_deadline_days=hr_deadline_days,
            current_channel=current_channel,
            is_scheduled=is_scheduled,
            has_whatsapp_replied=has_whatsapp_replied,
            questions=questions,
            key_criteria=key_criteria
        )

    def start_conversation(self) -> str:
        return self.agent.get_initial_greeting()

    def get_initial_greeting(self) -> str:
        return self.agent.get_initial_greeting()

    async def handle_whatsapp_message(self, user_message: str) -> str:
        """Processes incoming candidate text message via WhatsApp."""
        return await self.agent.generate_response(user_message)

    async def handle_voice_turn(self, user_speech: str) -> str:
        """Processes candidate's speech utterance during a Voice Call."""
        return await self.agent.generate_response(user_speech)
