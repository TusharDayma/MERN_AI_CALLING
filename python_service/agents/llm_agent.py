from config import USE_MOCK_AGENTS, BRAIN_MODEL
import asyncio
import logging
import json

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────
MAX_FOLLOW_UPS = 1   # max clarification probes per question (insufficient)
MAX_OFF_TOPIC  = 2   # max times to rephrase before flagging & moving on


class LLMAgent:
    def __init__(self, role: str = None, questions: list = None, key_criteria: list = None):
        self.is_mock = USE_MOCK_AGENTS
        self.role    = role or "the open position"

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

        # ── Interview state ────────────────────────────────────────────────────
        self.current_question_idx = 0
        self.attempts       = 0   # follow-up probes for 'insufficient' answers
        self.off_topic_count = 0  # consecutive off-topic replies for current Q
        self.first_question_asked = False

        # ── Tracking for ranker ────────────────────────────────────────────────
        self.conversation_history = []
        self.fluency_scores  = []   # list of int (1-5) per candidate utterance
        self.off_topic_flags = []   # list of {question, times} for off-topic Qs

    # ──────────────────────────────────────────────────────────────────────────
    # Smart built-in fallback (mock mode + Ollama-down fallback)
    # ──────────────────────────────────────────────────────────────────────────
    def _generate_smart_response(self) -> str:
        """
        Produces a contextually correct spoken response without calling any LLM.
        Used in mock mode and as the Ollama-down fallback.

        Per-question state machine:
          - 1st answer → give one follow-up probe (attempts: 0 → 1)
          - 2nd answer → advance to next question (attempts reset to 0)
          Off-topic path: rephrase once (off_topic_count: 0→1), then advance.
        """
        if not self.first_question_asked:
            self.first_question_asked = True
            return (
                f"Thank you for joining! Let me start our pre-screening. "
                f"First question: {self.questions[self.current_question_idx]}"
            )

        current_q = self.questions[self.current_question_idx]

        # Off-topic re-ask path (only used when real LLM flags off_topic)
        if self.off_topic_count > 0:
            if self.off_topic_count < MAX_OFF_TOPIC:
                self.off_topic_count += 1
                return (
                    f"I want to make sure I understood you correctly. "
                    f"Could you tell me: {current_q}"
                )
            else:
                # Threshold reached — flag and fall through to advance
                self.off_topic_flags.append({
                    "question": current_q,
                    "times_off_topic": self.off_topic_count
                })
                self.off_topic_count = 0
                self.attempts = 0
                self.current_question_idx += 1

        elif self.attempts < MAX_FOLLOW_UPS:
            # First time answering this question → give one follow-up probe
            self.attempts += 1
            return f"Could you be a bit more specific? {current_q}"

        else:
            # Follow-up already given → advance to next question
            self.current_question_idx += 1
            self.attempts        = 0
            self.off_topic_count = 0

        if self.current_question_idx < len(self.questions):
            return (
                f"Thank you for that. Next question: "
                f"{self.questions[self.current_question_idx]}"
            )
        return (
            "Thank you so much for your time today. We've completed all the pre-screening questions. "
            "Our HR team will review your responses and get back to you shortly. "
            "Have a great day! Goodbye."
        )


    async def generate_response(self, user_text: str) -> str:
        """
        Processes candidate's spoken reply, evaluates it, and returns the
        AI interviewer's next spoken response for TTS.
        """
        self.conversation_history.append({"role": "user", "content": user_text})

        C_CYAN   = "\033[96m"; C_YELLOW = "\033[93m"
        C_BLUE   = "\033[94m"; C_GREEN  = "\033[92m"
        C_RED    = "\033[91m"; C_RESET  = "\033[0m"

        print(f"\n{C_CYAN}======================================================================{C_RESET}")
        print(f"{C_CYAN}[🧠 LLM BRAIN AGENT] Processing candidate answer...{C_RESET}")
        print(f"{C_YELLOW}Candidate replied:{C_RESET} \"{user_text}\"")

        # ── Guard: all questions done ─────────────────────────────────────────
        if self.current_question_idx >= len(self.questions):
            closing = (
                "Thank you so much for your time today. We have completed all the pre-screening questions. "
                "Our HR team will be in touch with you shortly. "
                "Have a wonderful day! Goodbye."
            )
            self.conversation_history.append({"role": "assistant", "content": closing})
            print(f"{C_GREEN}[🧠 LLM BRAIN AGENT] All questions done. Closing.{C_RESET}")
            print(f"{C_CYAN}======================================================================{C_RESET}\n")
            return closing

        # ── Mock mode ─────────────────────────────────────────────────────────
        if self.is_mock:
            await asyncio.sleep(0.6)
            print(f"{C_BLUE}[🧠 LLM BRAIN AGENT] Mock Mode active.{C_RESET}")
            reply = self._generate_smart_response()
            self.fluency_scores.append(4)  # mock fluency score
            self.conversation_history.append({"role": "assistant", "content": reply})
            print(f"{C_GREEN}[🧠 LLM BRAIN AGENT] Mock reply: \"{reply}\"{C_RESET}")
            print(f"{C_CYAN}======================================================================{C_RESET}\n")
            return reply

        # ── Real LLM path (Ollama) ────────────────────────────────────────────
        import ollama

        current_q    = self.questions[self.current_question_idx]
        current_crit = self.key_criteria[self.current_question_idx]
        allow_followup = (self.attempts < MAX_FOLLOW_UPS)

        next_q = (
            self.questions[self.current_question_idx + 1]
            if self.current_question_idx + 1 < len(self.questions)
            else "None"
        )

        print(f"{C_BLUE}[🧠 LLM BRAIN AGENT] Real LLM Mode (Model: '{BRAIN_MODEL}'){C_RESET}")
        print(f"  Question {self.current_question_idx + 1}/{len(self.questions)}: \"{current_q}\"")
        print(f"  Off-topic count: {self.off_topic_count}/{MAX_OFF_TOPIC}  |  Follow-up attempts: {self.attempts}/{MAX_FOLLOW_UPS}")
        print(f"{C_BLUE}[🧠 LLM BRAIN AGENT] Querying local Ollama...{C_RESET}")

        # ── System instruction ─────────────────────────────────────────────────
        system_instruction = (
            f"You are a warm, professional AI HR Pre-Screening Agent conducting a phone screening interview for {self.role}.\n"
            f"Your job: listen to the candidate's reply, evaluate it, and generate the next spoken response.\n\n"
            f"Output ONLY valid JSON in exactly this format (no extra text):\n"
            f"{{\n"
            f"  \"answer_status\": \"relevant\" | \"off_topic\" | \"insufficient\",\n"
            f"  \"fluency_score\": <integer 1 to 5>,\n"
            f"  \"response\": \"<your spoken response>\"\n"
            f"}}\n\n"
            f"answer_status definitions:\n"
            f"- 'relevant':      The candidate directly answered the question (even briefly).\n"
            f"- 'insufficient':  Partial or vague answer that needs one specific follow-up detail.\n"
            f"- 'off_topic':     The candidate answered something unrelated to the question asked.\n\n"
            f"fluency_score (1-5):\n"
            f"  5=Excellent, 4=Good, 3=Moderate, 2=Basic, 1=Poor English fluency.\n\n"
            f"response rules:\n"
            f"- Natural conversational spoken language — it will be played via phone TTS.\n"
            f"- No markdown, no asterisks, no bullet points, no lists.\n"
            f"- Concise: 1-3 sentences max.\n"
            f"- Warm and encouraging tone.\n"
            f"- If 'off_topic': Politely say you'd like to come back to the question and rephrase it simply.\n"
            f"- If 'insufficient': Ask ONE specific follow-up to get the missing detail.\n"
            f"- If 'relevant': Briefly acknowledge and move to the next topic or close.\n"
        )

        # ── Prompt ────────────────────────────────────────────────────────────
        if not self.first_question_asked:
            prompt = (
                f"The candidate replied to your greeting.\n"
                f"Candidate reply: '{user_text}'\n\n"
                f"Task:\n"
                f"1. Always set answer_status to 'relevant' for greetings.\n"
                f"2. Score their English fluency (1-5).\n"
                f"3. In 'response': warmly acknowledge and transition directly to the first pre-screening question.\n"
                f"   The first question to ask is: '{current_q}'\n"
                f"   Ask ONLY this question — do not add your own."
            )
        else:
            criteria_text = f"\nKey criteria for a complete answer: '{current_crit}'" if current_crit.strip() else ""
            off_topic_note = (
                f"\nIMPORTANT: The candidate has already gone off-topic {self.off_topic_count} time(s) for this question. "
                f"If off_topic again (count >= {MAX_OFF_TOPIC}), set answer_status='off_topic' — the caller will handle advancing. "
                f"Otherwise rephrase the question simply."
                if self.off_topic_count > 0 else ""
            )
            prompt = (
                f"You asked the candidate: '{current_q}'{criteria_text}\n"
                f"Candidate's reply: '{user_text}'\n"
                f"{off_topic_note}\n\n"
                f"Task:\n"
                f"1. Determine answer_status (relevant / off_topic / insufficient).\n"
                f"2. Score English fluency (1-5).\n"
                f"3. Generate 'response':\n"
                f"   - 'off_topic': Say something like 'I want to make sure I got that — [rephrase question simply].'\n"
                f"   - 'insufficient' and allow_followup={allow_followup}: Ask ONE specific follow-up question.\n"
                f"   - 'relevant' or (insufficient with allow_followup=False): Briefly acknowledge and "
                + (f"ask the next question: '{next_q}'." if next_q != "None" else "warmly close the interview.")
                + f"\n"
                f"Context: allow_followup={allow_followup}, off_topic_count={self.off_topic_count}/{MAX_OFF_TOPIC}"
            )

        messages = [{"role": "system", "content": system_instruction}]
        messages.extend(self.conversation_history[:-1])
        messages.append({"role": "user", "content": prompt})

        try:
            response = ollama.chat(model=BRAIN_MODEL, messages=messages, format='json')
            raw_content = response['message']['content']
            print(f"{C_GREEN}[🧠 LLM BRAIN AGENT] Raw LLM JSON Output:{C_RESET}\n{raw_content}")

            # Clean & parse
            cleaned = raw_content.strip()
            if cleaned.startswith("```"):
                nl = cleaned.find("\n")
                cleaned = cleaned[nl:].strip() if nl != -1 else cleaned
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3].strip()

            result        = json.loads(cleaned)
            answer_status = result.get("answer_status", "relevant")
            fluency_score = int(result.get("fluency_score", 3))
            reply         = result.get("response", "Thank you. Let me move on.")

            # Record fluency
            self.fluency_scores.append(max(1, min(5, fluency_score)))

            # ── State transitions ──────────────────────────────────────────────
            if not self.first_question_asked:
                self.first_question_asked = True
                # Don't advance idx — we just asked Question 1

            elif answer_status == "off_topic":
                self.off_topic_count += 1
                if self.off_topic_count >= MAX_OFF_TOPIC:
                    # Flag it and advance
                    self.off_topic_flags.append({
                        "question":       current_q,
                        "times_off_topic": self.off_topic_count
                    })
                    self.current_question_idx += 1
                    self.attempts        = 0
                    self.off_topic_count = 0
                    print(f"{C_YELLOW}[🧠 LLM BRAIN AGENT] Off-topic threshold reached. Advancing.{C_RESET}")
                # else: don't advance — LLM already rephrased in 'response'

            elif answer_status == "insufficient" and allow_followup:
                self.attempts += 1
                # Don't advance — LLM asked follow-up in 'response'

            else:
                # 'relevant' or 'insufficient' with no follow-ups left
                self.current_question_idx += 1
                self.attempts        = 0
                self.off_topic_count = 0

            self.conversation_history.append({"role": "assistant", "content": reply})
            print(f"{C_GREEN}[🧠 LLM BRAIN AGENT] Decision:{C_RESET}")
            print(f"  answer_status={answer_status}  fluency={fluency_score}  next_q_idx={self.current_question_idx}")
            print(f"  AI replied: \"{reply}\"")
            print(f"{C_CYAN}======================================================================{C_RESET}\n")
            return reply

        except Exception as e:
            logger.error(f"Error in LLMAgent generate_response: {e}", exc_info=True)
            print(f"{C_RED}[🧠 LLM BRAIN AGENT] Ollama error: {e}{C_RESET}")
            print(f"{C_YELLOW}[🧠 LLM BRAIN AGENT] Using smart built-in fallback.{C_RESET}")

            if not self.first_question_asked:
                self.first_question_asked = True
            reply = self._generate_smart_response()
            self.fluency_scores.append(3)
            self.conversation_history.append({"role": "assistant", "content": reply})
            print(f"{C_YELLOW}  Fallback reply: \"{reply}\"{C_RESET}")
            print(f"{C_CYAN}======================================================================{C_RESET}\n")
            return reply
