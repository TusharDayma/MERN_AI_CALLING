from config import USE_MOCK_AGENTS, LLM_PROVIDER, GROQ_API_KEY, GROQ_LLM_MODEL, HF_API_KEY, HF_LLM_MODEL
import asyncio
import logging
import json

logger = logging.getLogger(__name__)

# Constants
MAX_FOLLOW_UPS = 1   # Max clarification probes per question
MAX_OFF_TOPIC  = 2   # Max times to rephrase before flagging & moving on


class LLMAgent:
    """
    Core Agentic LLM Decision & Dialogue Engine.
    Handles channel-specific conversation flows, state tracking, and operational rules.
    """
    
    # Lazy-loaded reusable client instances to eliminate instantiation overhead
    _groq_client = None
    _hf_client = None

    def __init__(
        self,
        role: str = None,
        questions: list = None,
        key_criteria: list = None,
        candidate_name: str = "Candidate",
        campaign_brief: str = None,
        scheduling_link: str = "https://calendly.com/hr-screening",
        hr_deadline_days: int = 3,
        current_channel: str = "Voice",  # 'WhatsApp' or 'Voice'
        is_scheduled: bool = False,
        has_whatsapp_replied: bool = False
    ):
        self.is_mock = USE_MOCK_AGENTS
        self.candidate_name = candidate_name or "Candidate"
        self.role = role or "the open position"
        self.campaign_brief = campaign_brief or f"{self.role} position"
        self.scheduling_link = scheduling_link or "https://calendly.com/hr-screening"
        self.hr_deadline_days = hr_deadline_days or 3
        self.current_channel = current_channel or "Voice"
        self.is_scheduled = is_scheduled
        self.has_whatsapp_replied = has_whatsapp_replied

        # HR-provided screening questions
        self.questions = questions or [
            "Could you briefly tell me about yourself and your current role?",
            "What is your current CTC or annual package?",
            "What is your notice period?",
        ]
        self.key_criteria = key_criteria or [''] * len(self.questions)
        while len(self.key_criteria) < len(self.questions):
            self.key_criteria.append('')

        # Interview & state tracking
        self.current_question_idx = 0
        self.attempts = 0
        self.off_topic_count = 0
        self.first_question_asked = False
        self.is_completed = False
        self.candidate_status = "PENDING"  # PENDING, INTERESTED, SCHEDULED, DECLINED, COMPLETED

        # Rule 4 tracking for unsolicited fallback calls
        if self.current_channel == "Voice" and not self.is_scheduled:
            self.fallback_voice_stage = "intro"
        else:
            self.fallback_voice_stage = "screening"

        # History and analysis records
        self.conversation_history = []
        self.fluency_scores = []
        self.off_topic_flags = []

    def _get_client(self):
        """Returns cached LLM client based on configured provider."""
        if self.is_mock:
            return None

        if LLM_PROVIDER == "huggingface":
            if LLMAgent._hf_client is None and HF_API_KEY:
                try:
                    from huggingface_hub import AsyncInferenceClient
                    LLMAgent._hf_client = AsyncInferenceClient(api_key=HF_API_KEY)
                except Exception as e:
                    logger.error(f"[LLM Agent] Failed to initialize AsyncInferenceClient: {e}")
            return LLMAgent._hf_client
        else:
            if LLMAgent._groq_client is None and GROQ_API_KEY:
                try:
                    from groq import AsyncGroq
                    LLMAgent._groq_client = AsyncGroq(api_key=GROQ_API_KEY)
                except Exception as e:
                    logger.error(f"[LLM Agent] Failed to initialize AsyncGroq: {e}")
            return LLMAgent._groq_client

    def get_initial_greeting(self) -> str:
        """Generates initial greeting depending on channel and schedule state."""
        if self.current_channel == "WhatsApp":
            greeting = (
                f"Hi {self.candidate_name}! I'm the AI Recruitment Assistant reaching out on behalf of HR. "
                f"We have an opening for the following role: {self.campaign_brief}. "
                f"Are you interested in being considered for this opportunity?"
            )
        elif self.is_scheduled:
            first_q = self.questions[self.current_question_idx] if self.questions else ""
            greeting = (
                f"Hello {self.candidate_name}! Thank you for joining our scheduled call today regarding the {self.campaign_brief}. "
                f"I'm excited to conduct your preliminary voice screening. "
                f"Let's start with the first question: {first_q}"
            )
            self.first_question_asked = True
            self.candidate_status = "SCHEDULED"
        else:
            greeting = (
                f"Hello {self.candidate_name}! I am an AI Recruitment Assistant following up on a WhatsApp message "
                f"regarding the {self.campaign_brief}. Do you have a minute to hear about the opportunity?"
            )
            self.fallback_voice_stage = "intro"
            self.candidate_status = "PENDING"

        self.conversation_history.append({"role": "assistant", "content": greeting})
        return greeting

    def _generate_smart_response(self, user_text: str = "") -> str:
        """Lightweight deterministic fallback engine for mock mode & API errors."""
        user_lower = user_text.lower().strip()
        negative_words = {"not interested", "no", "nope", "pass", "stop", "busy", "don't want", "cannot talk", "can't talk"}
        positive_words = {"yes", "yeah", "sure", "interested", "yep", "absolutely", "i am", "ok", "okay", "i do", "go ahead"}

        # WhatsApp channel logic
        if self.current_channel == "WhatsApp":
            if any(w in user_lower for w in negative_words):
                self.candidate_status = "DECLINED"
                self.is_completed = True
                return f"Thank you for letting us know, {self.candidate_name}. We wish you all the best in your job search!"
            elif any(w in user_lower for w in positive_words):
                self.candidate_status = "SCHEDULED"
                return (
                    f"Great news, {self.candidate_name}! Please use this link to schedule your preliminary screening interview: "
                    f"{self.scheduling_link}. Kindly book a time within the next {self.hr_deadline_days} days. "
                    f"Looking forward to speaking with you!"
                )
            else:
                return (
                    f"Thank you for your response, {self.candidate_name}. "
                    f"Could you please confirm if you are interested in the {self.campaign_brief} role?"
                )

        # Fallback Voice Call stage logic
        if self.current_channel == "Voice" and not self.is_scheduled:
            if self.fallback_voice_stage == "intro":
                if any(w in user_lower for w in negative_words):
                    self.fallback_voice_stage = "declined"
                    self.candidate_status = "DECLINED"
                    self.is_completed = True
                    return f"No problem at all, {self.candidate_name}. Thank you for your time and have a great day! Goodbye."
                elif any(w in user_lower for w in positive_words):
                    self.fallback_voice_stage = "interest_check"
                    return f"Great! Are you interested in being considered for the {self.campaign_brief} role?"
                else:
                    return f"Do you have a quick minute to discuss the {self.campaign_brief} opportunity?"

            elif self.fallback_voice_stage == "interest_check":
                if any(w in user_lower for w in negative_words):
                    self.fallback_voice_stage = "declined"
                    self.candidate_status = "DECLINED"
                    self.is_completed = True
                    return f"Understood, {self.candidate_name}. Thank you for letting us know, and have a great day! Goodbye."
                elif any(w in user_lower for w in positive_words):
                    self.fallback_voice_stage = "screening"
                    self.first_question_asked = True
                    self.candidate_status = "INTERESTED"
                    first_q = self.questions[self.current_question_idx] if self.questions else ""
                    return f"Wonderful! Let me transition directly into our screening questions. First question: {first_q}"
                else:
                    return f"Could you please confirm if you would be interested in the {self.campaign_brief} role?"

        # Voice screening questions logic
        if not self.first_question_asked:
            self.first_question_asked = True
            return (
                f"Thank you, {self.candidate_name}! Let's start our pre-screening interview. "
                f"First question: {self.questions[self.current_question_idx]}"
            )

        current_q = self.questions[self.current_question_idx] if self.current_question_idx < len(self.questions) else ""

        if self.off_topic_count > 0:
            if self.off_topic_count < MAX_OFF_TOPIC:
                self.off_topic_count += 1
                return f"I want to make sure I understood you correctly. Could you tell me: {current_q}"
            else:
                self.off_topic_flags.append({"question": current_q, "times_off_topic": self.off_topic_count})
                self.off_topic_count = 0
                self.attempts = 0
                self.current_question_idx += 1
        elif self.attempts < MAX_FOLLOW_UPS:
            self.attempts += 1
            return f"Could you be a bit more specific? {current_q}"
        else:
            self.current_question_idx += 1
            self.attempts = 0
            self.off_topic_count = 0

        if self.current_question_idx < len(self.questions):
            return f"Thank you for that. Next question: {self.questions[self.current_question_idx]}"

        self.is_completed = True
        self.candidate_status = "COMPLETED"
        return (
            f"Thank you so much for your time today, {self.candidate_name}. We've completed all the pre-screening questions. "
            f"Our HR team will review your responses and get back to you shortly. Have a great day! Goodbye."
        )

    async def generate_response(self, user_text: str) -> str:
        """Processes candidate input, calls async LLM API, and updates conversation state."""
        self.conversation_history.append({"role": "user", "content": user_text})
        logger.info(f"[LLM Agent] Input received ({self.current_channel}): '{user_text}'")

        # Check if call is already completed
        if self.is_completed or (self.current_question_idx >= len(self.questions) and self.first_question_asked):
            closing = (
                f"Thank you so much for your time today, {self.candidate_name}. We have completed our preliminary process. "
                f"Our HR team will be in touch with you shortly. Have a wonderful day! Goodbye."
            )
            self.conversation_history.append({"role": "assistant", "content": closing})
            return closing

        # Fast path for mock mode
        if self.is_mock:
            await asyncio.sleep(0.05)
            reply = self._generate_smart_response(user_text)
            self.fluency_scores.append(4)
            self.conversation_history.append({"role": "assistant", "content": reply})
            return reply

        # Build lean system prompt
        system_instruction = (
            f"You are an empathetic, professional AI HR Recruitment Assistant.\n"
            f"Candidate: {self.candidate_name} | Role: {self.campaign_brief}\n"
            f"Link: {self.scheduling_link} | Window: {self.hr_deadline_days} days | Mode: {self.current_channel}\n\n"
            f"Output JSON ONLY:\n"
            f"{{\n"
            f'  "answer_status": "relevant" | "off_topic" | "insufficient" | "interested" | "not_interested",\n'
            f'  "fluency_score": <1-5>,\n'
            f'  "response": "<natural spoken text 1-3 sentences without markdown>"\n'
            f"}}\n"
        )

        # Context pruning: pass only recent turns + system instruction to keep tokens minimal
        recent_turns = [m for m in self.conversation_history[-6:] if m.get("role") in ("user", "assistant")]
        messages = [{"role": "system", "content": system_instruction}, *recent_turns]

        client = self._get_client()

        if client is not None:
            try:
                if LLM_PROVIDER == "huggingface":
                    completion = await client.chat_completion(
                        model=HF_LLM_MODEL,
                        messages=messages,
                        temperature=0.3,
                        max_tokens=256,
                        response_format={"type": "json_object"}
                    )
                else:
                    completion = await client.chat.completions.create(
                        model=GROQ_LLM_MODEL,
                        messages=messages,
                        response_format={"type": "json_object"},
                        temperature=0.3,
                        max_tokens=256
                    )

                raw_content = completion.choices[0].message.content.strip()
                if raw_content.startswith("```"):
                    raw_content = raw_content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

                result = json.loads(raw_content)
                answer_status = result.get("answer_status", "relevant")
                fluency_score = int(result.get("fluency_score", 3))
                reply = result.get("response", "Thank you.")

                self.fluency_scores.append(max(1, min(5, fluency_score)))

                # Voice intent check state transitions
                if self.current_channel == "Voice" and not self.is_scheduled and self.fallback_voice_stage != "screening":
                    if answer_status in ["not_interested", "declined"]:
                        self.fallback_voice_stage = "declined"
                        self.candidate_status = "INTEREST_DECLINED"
                        self.is_completed = True
                        reply = f"Understood, {self.candidate_name}. Thank you for letting us know, and have a great day! Goodbye."
                        self.conversation_history.append({"role": "assistant", "content": reply})
                        return reply
                    elif answer_status in ["interested", "relevant"]:
                        if self.fallback_voice_stage == "intro":
                            self.fallback_voice_stage = "interest_check"
                            reply = f"Great! Are you interested in being considered for the {self.campaign_brief} role?"
                        elif self.fallback_voice_stage == "interest_check":
                            self.fallback_voice_stage = "screening"
                            self.first_question_asked = True
                            self.candidate_status = "INTERESTED"
                            first_q = self.questions[self.current_question_idx] if self.questions else ""
                            reply = f"Wonderful! Let me transition directly into our screening questions. First question: {first_q}"
                        self.conversation_history.append({"role": "assistant", "content": reply})
                        return reply

                # Voice screening questions state transitions
                if self.current_channel == "Voice" and (self.is_scheduled or self.fallback_voice_stage == "screening"):
                    current_q = self.questions[self.current_question_idx] if self.current_question_idx < len(self.questions) else ""
                    if answer_status in ["not_interested", "declined"]:
                        self.candidate_status = "INTEREST_DECLINED"
                        self.is_completed = True
                        reply = f"Understood, {self.candidate_name}. We will update our records. Thank you for your time today. Goodbye."
                        self.conversation_history.append({"role": "assistant", "content": reply})
                        return reply
                    elif answer_status == "off_topic":
                        self.off_topic_count += 1
                        if self.off_topic_count >= MAX_OFF_TOPIC:
                            self.off_topic_flags.append({"question": current_q, "times_off_topic": self.off_topic_count})
                            self.current_question_idx += 1
                            self.attempts = 0
                            self.off_topic_count = 0
                    elif answer_status == "insufficient" and self.attempts < MAX_FOLLOW_UPS:
                        self.attempts += 1
                    else:
                        self.current_question_idx += 1
                        self.attempts = 0
                        self.off_topic_count = 0

                    if self.current_question_idx >= len(self.questions):
                        self.is_completed = True
                        self.candidate_status = "COMPLETED"

                self.conversation_history.append({"role": "assistant", "content": reply})
                return reply

            except Exception as e:
                logger.error(f"[LLM Agent] API execution error: {e}", exc_info=True)

        # Fallback path if client missing or API error occurred
        reply = self._generate_smart_response(user_text)
        self.fluency_scores.append(3)
        self.conversation_history.append({"role": "assistant", "content": reply})
        return reply
