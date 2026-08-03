from config import USE_MOCK_AGENTS, LLM_PROVIDER, GROQ_API_KEY, GROQ_RANKER_MODEL, HF_API_KEY, HF_RANKER_MODEL
import logging
import json

logger = logging.getLogger(__name__)


class RankerAgent:
    def __init__(self):
        self.is_mock = USE_MOCK_AGENTS

    def evaluate_interview(
        self,
        conversation_history: list,
        fluency_scores: list = None,
        off_topic_flags: list = None
    ) -> tuple[int, dict]:
        """
        Evaluates the full pre-screening call and returns (ai_score, dossier).
        Uses Ollama for LLM scoring; falls back to keyword heuristics.

        Args:
            conversation_history: Full list of {role, content} messages.
            fluency_scores:       List of int (1-5) fluency ratings per candidate turn.
            off_topic_flags:      List of {question, times_off_topic} flagged items.
        """
        fluency_scores   = fluency_scores   or []
        off_topic_flags  = off_topic_flags  or []

        C_CYAN   = "\033[96m"; C_YELLOW = "\033[93m"
        C_BLUE   = "\033[94m"; C_GREEN  = "\033[92m"
        C_RED    = "\033[91m"; C_RESET  = "\033[0m"

        print(f"\n{C_CYAN}======================================================================{C_RESET}")
        print(f"{C_CYAN}[📊 ANALYST RANKER AGENT] Initiating post-call evaluation...{C_RESET}")
        print(f"  Transcript: {len(conversation_history)} messages")
        print(f"  Fluency scores: {fluency_scores}")
        print(f"  Off-topic flags: {off_topic_flags}")

        avg_fluency = round(sum(fluency_scores) / len(fluency_scores), 2) if fluency_scores else None

        # ── Early Exit / Candidate Decline Detection ───────────────────────────
        full_user_text = " ".join([m["content"].lower() for m in conversation_history if m.get("role") == "user"])
        is_declined = any(phrase in full_user_text for phrase in [
            "not interested", "no thank", "nope", "don't want", "pass", "busy", "cannot talk", "opt out"
        ]) and len(conversation_history) <= 6

        if is_declined:
            dossier = {
                "score": 0,
                "summary": "Candidate explicitly declined or opted out of the screening interview during the initial intent check.",
                "strengths": [],
                "weaknesses": ["Opted out of preliminary AI screening process"],
                "avg_fluency_score": avg_fluency or 0.0,
                "off_topic_flags": off_topic_flags,
                "status": "INTEREST_DECLINED",
                "transcript": conversation_history
            }
            print(f"{C_YELLOW}[📊 ANALYST RANKER AGENT] Candidate declined interview during Intent Check. Score set to 0 (INTEREST_DECLINED).{C_RESET}")
            print(f"{C_CYAN}======================================================================{C_RESET}\n")
            return (0, dossier)

        # ── Mock path ─────────────────────────────────────────────────────────
        if self.is_mock:
            dossier = {
                "score": 82,
                "summary": "The candidate presented themselves clearly and answered pre-screening questions professionally. CTC expectations and notice period are within acceptable range.",
                "strengths": ["Clear communication", "Relevant experience", "Flexible on relocation"],
                "weaknesses": ["Could provide more specific details on CTC expectations"],
                "avg_fluency_score": avg_fluency or 4.0,
                "off_topic_flags": off_topic_flags,
                "transcript": conversation_history
            }
            print(f"{C_GREEN}[📊 ANALYST RANKER AGENT] Mock scoring complete. Score: 82/100{C_RESET}")
            print(f"  Summary: {dossier['summary']}")
            print(f"{C_CYAN}======================================================================{C_RESET}\n")
            return (82, dossier)

        # ── Real path: Groq Chat Completions ──────────────────────────────────
        from groq import Groq

        system_instruction = (
            "You are an expert HR recruiter and talent analyst.\n"
            "Analyze the provided pre-screening interview transcript and generate a structured candidate evaluation in JSON format.\n\n"
            "CRITICAL INSTRUCTION: If the transcript indicates the candidate declined or opted out during the greeting/intent check (e.g. 'not interested', 'no thanks'), output score: 0, strengths: [], weaknesses: ['Opted out of recruitment process'], and summary: 'Candidate explicitly declined the screening interview during initial intent check.'\n\n"
            "Output ONLY this JSON schema (no extra text, no markdown):\n"
            "{\n"
            "  \"score\": <integer 0-100>,\n"
            "  \"summary\": \"<concise 2-3 sentence overall assessment>\",\n"
            "  \"strengths\": [\"<strength 1>\", \"<strength 2>\"],\n"
            "  \"weaknesses\": [\"<area 1>\"]\n"
            "}\n\n"
            "Scoring rubric for completed calls:\n"
            "- Answer completeness and relevance (40 pts)\n"
            "- Communication clarity and professionalism (30 pts)\n"
            "- Suitability signals (notice period, CTC fit, availability) (20 pts)\n"
            "- Engagement and enthusiasm (10 pts)\n"
        )

        # Build transcript text
        transcript_text = ""
        for msg in conversation_history:
            if msg.get("role") == "system":
                continue
            role = "Candidate" if msg["role"] == "user" else "AI Interviewer"
            transcript_text += f"{role}: {msg['content']}\n"

        # Append fluency and off-topic context
        extra_context = ""
        if avg_fluency is not None:
            extra_context += f"\nAverage English Fluency Score (1-5): {avg_fluency}"
        if off_topic_flags:
            flags_text = "; ".join(
                f"'{f['question']}' (went off-topic {f['times_off_topic']} times)"
                for f in off_topic_flags
            )
            extra_context += f"\nOff-topic flags (questions not answered directly): {flags_text}"

        prompt = (
            f"Please evaluate this pre-screening interview transcript:{extra_context}\n\n"
            f"{transcript_text}"
        )

        try:
            if LLM_PROVIDER == "huggingface":
                from huggingface_hub import InferenceClient
                print(f"{C_BLUE}[📊 ANALYST RANKER AGENT] Using HuggingFace API. Model '{HF_RANKER_MODEL}'...{C_RESET}")
                client = InferenceClient(api_key=HF_API_KEY)
                completion = client.chat_completion(
                    model=HF_RANKER_MODEL,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user",   "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=512,
                    response_format={"type": "json_object"}
                )
                raw_content = completion.choices[0].message.content.strip()
            else:
                from groq import Groq
                print(f"{C_BLUE}[📊 ANALYST RANKER AGENT] Using Groq API. Model '{GROQ_RANKER_MODEL}'...{C_RESET}")
                groq_client = Groq(api_key=GROQ_API_KEY)
                completion = groq_client.chat.completions.create(
                    model=GROQ_RANKER_MODEL,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user",   "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=512
                )
                raw_content = completion.choices[0].message.content.strip()

            # Clean up markdown code fences if present
            if raw_content.startswith("```"):
                nl = raw_content.find("\n")
                raw_content = raw_content[nl:].strip() if nl != -1 else raw_content
                if raw_content.endswith("```"):
                    raw_content = raw_content[:-3].strip()

            print(f"{C_GREEN}[📊 ANALYST RANKER AGENT] Raw JSON Response:{C_RESET}\n{raw_content}")

            dossier = json.loads(raw_content)
            dossier["avg_fluency_score"] = avg_fluency
            dossier["off_topic_flags"]   = off_topic_flags
            dossier["transcript"]        = conversation_history
            score = int(dossier.get("score", 0))

            print(f"{C_GREEN}[📊 ANALYST RANKER AGENT] Evaluation complete. Score: {score}/100{C_RESET}")
            print(f"  Summary: {dossier.get('summary')}")
            print(f"  Strengths: {dossier.get('strengths')}")
            print(f"  Weaknesses: {dossier.get('weaknesses')}")
            print(f"{C_CYAN}======================================================================{C_RESET}\n")
            return (score, dossier)

        except Exception as e:
            logger.error(f"Error in RankerAgent evaluation: {e}", exc_info=True)
            print(f"{C_RED}[📊 ANALYST RANKER AGENT] API error ({LLM_PROVIDER}): {e}{C_RESET}")
            print(f"{C_YELLOW}[📊 ANALYST RANKER AGENT] Using keyword + fluency heuristic fallback.{C_RESET}")

        # ── Keyword + fluency heuristic fallback ──────────────────────────────
        candidate_text = " ".join(
            msg["content"].lower()
            for msg in conversation_history
            if msg.get("role") == "user"
        )

        keywords = {
            "experience": 8, "years": 5, "current role": 6, "working": 4,
            "ctc": 10, "lakhs": 8, "salary": 7, "package": 6,
            "notice": 10, "days": 5, "immediate": 8, "joining": 5,
            "relocate": 8, "location": 5, "remote": 6, "hybrid": 6,
            "skills": 4, "developer": 4, "engineer": 4,
        }
        score = 35  # base for completing the call
        matched = []
        for kw, pts in keywords.items():
            if kw in candidate_text:
                score += pts
                matched.append(kw)
        score = min(score, 100)

        # Adjust for fluency
        if avg_fluency is not None:
            fluency_bonus = int((avg_fluency - 3) * 3)  # -6 to +6
            score = max(0, min(100, score + fluency_bonus))

        # Penalise off-topic flags
        score = max(0, score - len(off_topic_flags) * 5)

        dossier = {
            "score": score,
            "summary": (
                f"Automated pre-screening evaluation (Groq unavailable). "
                f"Candidate addressed {len(matched)} key pre-screening topics."
                + (f" Average fluency score: {avg_fluency}/5." if avg_fluency else "")
            ),
            "strengths": matched[:3] if matched else ["Completed the screening call"],
            "weaknesses": (
                [f"Off-topic on: {f['question'][:40]}..." for f in off_topic_flags[:2]]
                or ["Manual review recommended"]
            ),
            "avg_fluency_score": avg_fluency,
            "off_topic_flags":   off_topic_flags,
            "transcript":        conversation_history
        }

        print(f"{C_YELLOW}[📊 ANALYST RANKER AGENT] Heuristic Fallback Score: {score}/100{C_RESET}")
        print(f"{C_CYAN}======================================================================{C_RESET}\n")
        return (score, dossier)
