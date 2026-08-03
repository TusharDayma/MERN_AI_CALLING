from config import USE_MOCK_AGENTS, LLM_PROVIDER, GROQ_API_KEY, GROQ_LLM_MODEL, HF_API_KEY, HF_LLM_MODEL
import asyncio
import logging
import json

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────
MAX_FOLLOW_UPS = 1   # max clarification probes per question (insufficient)
MAX_OFF_TOPIC  = 2   # max times to rephrase before flagging & moving on


class LLMAgent:
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

        # ── Use ONLY HR-provided questions. No hardcoded technical questions. ──
        self.questions = questions or [
            "Could you briefly tell me about yourself and your current role?",
            "What is your current CTC or annual package?",
            "What is your notice period?",
        ]
        self.key_criteria = key_criteria or [''] * len(self.questions)

        # Pad key_criteria to match questions length
        while len(self.key_criteria) < len(self.questions):
            self.key_criteria.append('')

        # ── Interview / Outreach state ─────────────────────────────────────────
        self.current_question_idx = 0
        self.attempts       = 0   # follow-up probes for 'insufficient' answers
        self.off_topic_count = 0  # consecutive off-topic replies for current Q
        self.first_question_asked = False
        self.is_completed = False
        self.candidate_status = "PENDING"  # PENDING, INTERESTED, SCHEDULED, DECLINED, COMPLETED

        # Rule 4 state tracking (Fallback Voice Call)
        # Stages: 'intro' -> 'interest_check' -> 'screening' -> 'declined'
        if self.current_channel == "Voice" and not self.is_scheduled:
            self.fallback_voice_stage = "intro"
        else:
            self.fallback_voice_stage = "screening"

        # ── Tracking for ranker ────────────────────────────────────────────────
        self.conversation_history = []
        self.fluency_scores  = []   # list of int (1-5) per candidate utterance
        self.off_topic_flags = []   # list of {question, times} for off-topic Qs

    def get_initial_greeting(self) -> str:
        """
        Generates the starting prompt/greeting depending on channel and scheduled state.
        """
        if self.current_channel == "WhatsApp":
            # Rule 1: Initial WhatsApp Outreach
            greeting = (
                f"Hi {self.candidate_name}! I'm the AI Recruitment Assistant reaching out on behalf of HR. "
                f"We have an opening for the following role: {self.campaign_brief}. "
                f"Are you interested in being considered for this opportunity?"
            )
        elif self.is_scheduled:
            # Rule 3: Scheduled Voice Call
            first_q = self.questions[self.current_question_idx]
            greeting = (
                f"Hello {self.candidate_name}! Thank you for joining our scheduled call today regarding the {self.campaign_brief}. "
                f"I'm excited to conduct your preliminary voice screening. "
                f"Let's start with the first question: {first_q}"
            )
            self.first_question_asked = True
            self.candidate_status = "SCHEDULED"
        else:
            # Rule 4: Fallback Voice Call (No WhatsApp Response / Unsolicited)
            greeting = (
                f"Hello {self.candidate_name}! I am an AI Recruitment Assistant following up on a WhatsApp message "
                f"regarding the {self.campaign_brief}. Do you have a minute to hear about the opportunity?"
            )
            self.fallback_voice_stage = "intro"
            self.candidate_status = "PENDING"

        self.conversation_history.append({"role": "assistant", "content": greeting})
        return greeting

    # ──────────────────────────────────────────────────────────────────────────
    # Smart built-in fallback (mock mode + API-down fallback)
    # ──────────────────────────────────────────────────────────────────────────
    def _generate_smart_response(self, user_text: str = "") -> str:
        user_lower = user_text.lower().strip()

        # ── WhatsApp logic (Rules 1 & 2) ──────────────────────────────────────
        if self.current_channel == "WhatsApp":
            negative_words = ["not interested", "no", "nope", "pass", "stop", "busy", "don't want"]
            positive_words = ["yes", "yeah", "sure", "interested", "yep", "absolutely", "i am"]

            if any(w in user_lower for w in negative_words):
                self.candidate_status = "DECLINED"
                self.is_completed = True
                return f"Thank you for letting us know, {self.candidate_name}. We wish you all the best in your job search!"
            elif any(w in user_lower for w in positive_words):
                self.candidate_status = "SCHEDULED"
                # Rule 2: Provide scheduling link and deadline window
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

        # ── Fallback Voice Call logic (Rule 4) ─────────────────────────────────
        if self.current_channel == "Voice" and not self.is_scheduled:
            negative_words = ["not interested", "no", "nope", "busy", "don't have time", "can't talk", "pass", "stop"]
            positive_words = ["yes", "yeah", "sure", "interested", "yep", "ok", "okay", "i do", "i am", "go ahead"]

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
                    first_q = self.questions[self.current_question_idx]
                    return f"Wonderful! Let me transition directly into our screening questions. First question: {first_q}"
                else:
                    return f"Could you please confirm if you would be interested in the {self.campaign_brief} role?"

        # ── Voice Screening Questions logic (Rules 3 & 4 screening stage) ─────
        if not self.first_question_asked:
            self.first_question_asked = True
            return (
                f"Thank you, {self.candidate_name}! Let's start our pre-screening interview. "
                f"First question: {self.questions[self.current_question_idx]}"
            )

        current_q = self.questions[self.current_question_idx]

        if self.off_topic_count > 0:
            if self.off_topic_count < MAX_OFF_TOPIC:
                self.off_topic_count += 1
                return f"I want to make sure I understood you correctly. Could you tell me: {current_q}"
            else:
                self.off_topic_flags.append({
                    "question": current_q,
                    "times_off_topic": self.off_topic_count
                })
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
        """
        Processes candidate's input, evaluates it according to operational rules,
        and returns the AI assistant's response.
        """
        self.conversation_history.append({"role": "user", "content": user_text})

        print(f"\n======================================================================")
        print(f"[LLM BRAIN AGENT] Processing candidate input...")
        print(f"Candidate [{self.candidate_name}] replied ({self.current_channel}): \"{user_text}\"")

        # ── Check if already completed ──────────────────────────────────────
        if self.is_completed or self.current_question_idx >= len(self.questions) and self.first_question_asked:
            closing = (
                f"Thank you so much for your time today, {self.candidate_name}. We have completed our preliminary process. "
                f"Our HR team will be in touch with you shortly. Have a wonderful day! Goodbye."
            )
            self.conversation_history.append({"role": "assistant", "content": closing})
            return closing

        # ── Mock mode fallback ──────────────────────────────────────────────
        if self.is_mock:
            await asyncio.sleep(0.1)
            print(f"[LLM BRAIN AGENT] Mock Mode active.")
            reply = self._generate_smart_response(user_text)
            self.fluency_scores.append(4)
            self.conversation_history.append({"role": "assistant", "content": reply})
            print(f"[LLM BRAIN AGENT] Mock reply: \"{reply}\"")
            print(f"======================================================================\n")
            return reply

        # ── Build system instruction ────────────────────────────────────────
        current_q    = self.questions[self.current_question_idx] if self.current_question_idx < len(self.questions) else ""
        current_crit = self.key_criteria[self.current_question_idx] if self.current_question_idx < len(self.key_criteria) else ""
        allow_followup = (self.attempts < MAX_FOLLOW_UPS)

        system_instruction = (
            f"You are an empathetic, professional AI HR Recruitment Assistant acting on behalf of HR.\n"
            f"Candidate Name: {self.candidate_name}\n"
            f"Campaign Brief: {self.campaign_brief}\n"
            f"Scheduling Link: {self.scheduling_link}\n"
            f"Booking Window: {self.hr_deadline_days} days\n"
            f"Interaction Mode: {self.current_channel}\n\n"
            f"Operational Rules:\n"
            f"Rule 1 (WhatsApp Initial): Provide brief role summary & explicitly ask if candidate is interested. Do NOT include link.\n"
            f"Rule 2 (WhatsApp Positive): If interested, provide {self.scheduling_link} & mention {self.hr_deadline_days}-day booking window.\n"
            f"Rule 3 (Scheduled Voice Call): Greet candidate by name, acknowledge scheduled time, ask screening questions one by one.\n"
            f"Rule 4 (Fallback Voice Call): If unsolicited, introduce & follow up on WhatsApp message regarding campaign brief. Ask for a minute. If YES -> check interest -> if INTERESTED -> transition to screening questions; if NO -> exit politely.\n\n"
            f"Output ONLY valid JSON in this exact format:\n"
            f"{{\n"
            f"  \"answer_status\": \"relevant\" | \"off_topic\" | \"insufficient\" | \"interested\" | \"not_interested\",\n"
            f"  \"fluency_score\": <integer 1 to 5>,\n"
            f"  \"response\": \"<your response>\"\n"
            f"}}\n"
            f"Rules for 'response':\n"
            f"- Spoken/Natural text suitable for channel.\n"
            f"- NO markdown asterisks, bolding, bullet points, or list numbers.\n"
            f"- Concise (1-3 sentences).\n"
        )

        messages = [
            {"role": "system", "content": system_instruction},
            *self.conversation_history
        ]

        # ── Real LLM path — Groq or HuggingFace ────────────────────────────
        try:
            if LLM_PROVIDER == "huggingface":
                from huggingface_hub import AsyncInferenceClient
                import json as _json
                print(f"[LLM BRAIN AGENT] Using HuggingFace API. Model: {HF_LLM_MODEL}")
                client = AsyncInferenceClient(api_key=HF_API_KEY)
                completion = await client.chat_completion(
                    model=HF_LLM_MODEL,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=256,
                    response_format={"type": "json_object"}
                )
                raw_content = completion.choices[0].message.content.strip()
            else:
                from groq import Groq
                print(f"[LLM BRAIN AGENT] Using Groq API. Model: {GROQ_LLM_MODEL}")
                groq_client = Groq(api_key=GROQ_API_KEY)
                completion = await asyncio.to_thread(
                    groq_client.chat.completions.create,
                    model=GROQ_LLM_MODEL,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=0.3,
                    max_tokens=256
                )
                raw_content = completion.choices[0].message.content.strip()

            # Clean up markdown code fences if present
            if raw_content.startswith("```"):
                nl = raw_content.find("\n")
                raw_content = raw_content[nl:].strip() if nl != -1 else raw_content
                if raw_content.endswith("```"):
                    raw_content = raw_content[:-3].strip()

            result        = json.loads(raw_content)
            answer_status = result.get("answer_status", "relevant")
            fluency_score = int(result.get("fluency_score", 3))
            reply         = result.get("response", "Thank you.")

            self.fluency_scores.append(max(1, min(5, fluency_score)))

            # Handle Fallback Voice Stage Intent Check in Real LLM Mode
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

            # State transitions for screening questions
            if self.current_channel == "Voice" and (self.is_scheduled or self.fallback_voice_stage == "screening"):
                if answer_status in ["not_interested", "declined"]:
                    self.candidate_status = "INTEREST_DECLINED"
                    self.is_completed = True
                    reply = f"Understood, {self.candidate_name}. We will update our records. Thank you for your time today. Goodbye."
                    self.conversation_history.append({"role": "assistant", "content": reply})
                    return reply
                elif answer_status == "off_topic":
                    self.off_topic_count += 1
                    if self.off_topic_count >= MAX_OFF_TOPIC:
                        self.off_topic_flags.append({
                            "question": current_q,
                            "times_off_topic": self.off_topic_count
                        })
                        self.current_question_idx += 1
                        self.attempts = 0
                        self.off_topic_count = 0
                elif answer_status == "insufficient" and allow_followup:
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
            logger.error(f"Error in LLMAgent generate_response: {e}", exc_info=True)
            print(f"[LLM BRAIN AGENT] API error ({LLM_PROVIDER}): {e}. Using smart built-in fallback.")
            reply = self._generate_smart_response(user_text)
            self.fluency_scores.append(3)
            self.conversation_history.append({"role": "assistant", "content": reply})
            return reply
