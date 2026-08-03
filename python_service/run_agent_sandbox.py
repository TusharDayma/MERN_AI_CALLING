# coding: utf-8
"""
AntiTalk AI Engine - Interactive Agent Sandbox
=============================================
A standalone interactive tester to run and check only the agents in isolation.
You can:
  1. Set candidate/campaign details.
  2. Upload/input campaign questions and criteria.
  3. Select Mock or Real Groq Mode.
  4. Choose conversation channels (WhatsApp vs Voice Scheduled vs Voice Fallback).
  5. Chat interactively turn-by-turn with LLMAgent.
  6. Verify TTSAgent audio generation.
  7. Run RankerAgent post-call analysis to evaluate the transcript.

Run with: python run_agent_sandbox.py
"""

import os
import sys
import asyncio
import json

# Ensure we can import modules from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.llm_agent import LLMAgent
from agents.ranker_agent import RankerAgent
from agents.tts_agent import TTSAgent
from config import GROQ_API_KEY, GROQ_STT_MODEL, GROQ_LLM_MODEL, GROQ_RANKER_MODEL

# Force UTF-8 output on Windows to support emojis and styling
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ── Styling Constants ────────────────────────────────────────────────────────
CYAN    = "\033[96m"
YELLOW  = "\033[93m"
GREEN   = "\033[92m"
RED     = "\033[91m"
BLUE    = "\033[94m"
MAGENTA = "\033[95m"
BOLD    = "\033[1m"
RESET   = "\033[0m"

def print_header(title, color=CYAN):
    print(f"\n{color}{'='*65}{RESET}")
    print(f"{BOLD}{color}  {title}{RESET}")
    print(f"{color}{'='*65}{RESET}")

def load_questions_from_file(filepath):
    """Loads questions from a JSON or TXT file."""
    if not os.path.exists(filepath):
        print(f"{RED}Error: File '{filepath}' not found.{RESET}")
        return None, None
    
    try:
        if filepath.endswith('.json'):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if isinstance(data, list):
                # Simple list of strings
                return data, [''] * len(data)
            elif isinstance(data, dict):
                # Expected format: { "questions": [...], "key_criteria": [...] }
                qs = data.get("questions", [])
                crit = data.get("key_criteria", [''] * len(qs))
                return qs, crit
        else:
            # Plain text file with questions line-by-line
            with open(filepath, 'r', encoding='utf-8') as f:
                qs = [line.strip() for line in f if line.strip()]
            return qs, [''] * len(qs)
    except Exception as e:
        print(f"{RED}Error parsing file: {e}{RESET}")
        return None, None

async def main():
    print_header("AntiTalk AI Engine - Interactive Agent Sandbox", MAGENTA)
    print(f"STT Model   : {GROQ_STT_MODEL}")
    print(f"LLM Model   : {GROQ_LLM_MODEL}")
    print(f"Ranker Model: {GROQ_RANKER_MODEL}")
    print(f"Groq API Key: {'Configured (Ends with ...' + GROQ_API_KEY[-5:] + ')' if GROQ_API_KEY else 'NOT CONFIGURED ❌'}")
    
    # 1. Mode Selection (Mock vs Real Groq)
    print(f"\n{BOLD}1. Select Execution Mode:{RESET}")
    print("  [1] Real Groq Mode (requires active API key)")
    print("  [2] Mock Mode (pre-defined offline replies)")
    mode_choice = input("Enter choice (1/2) [Default 2]: ").strip() or "2"
    is_mock = (mode_choice != "1")
    
    if not is_mock and not GROQ_API_KEY:
        print(f"{RED}WARNING: GROQ_API_KEY is not set in environment!{RESET}")
        print("Defaulting back to Mock Mode to prevent API crashes.")
        is_mock = True

    # 2. Upload/Input Campaign Questions
    print(f"\n{BOLD}2. Load Campaign Screening Questions:{RESET}")
    print("  [1] Use Default screening questions")
    print("  [2] Upload from a JSON/TXT file")
    print("  [3] Enter custom questions manually")
    q_choice = input("Enter choice (1/2/3) [Default 1]: ").strip() or "1"
    
    questions = None
    key_criteria = None
    
    if q_choice == "2":
        filepath = input("Enter path to questions file (e.g. questions.json): ").strip()
        questions, key_criteria = load_questions_from_file(filepath)
        if not questions:
            print(f"{YELLOW}Using default questions due to load failure.{RESET}")
            questions = None
    elif q_choice == "3":
        questions = []
        key_criteria = []
        print("\nEnter questions one by one. Press Enter on empty line to finish.")
        idx = 1
        while True:
            q = input(f"Question #{idx}: ").strip()
            if not q:
                break
            crit = input(f"  Key evaluation criteria for Q#{idx} (Optional): ").strip()
            questions.append(q)
            key_criteria.append(crit)
            idx += 1
            print()
            
    if not questions:
        questions = [
            "Could you briefly describe your experience with Node.js and React?",
            "What is your current notice period?",
            "What are your CTC expectations?"
        ]
        key_criteria = [
            "Must mention both backend Node.js and frontend React experience.",
            "Must state notice period in days or weeks.",
            "Must specify salary target or current CTC."
        ]

    print(f"\n{GREEN}Loaded Questions:{RESET}")
    for i, (q, c) in enumerate(zip(questions, key_criteria), 1):
        print(f"  {i}. {q}")
        if c:
            print(f"     Criteria: {c}")

    # 3. Channel Selection
    print(f"\n{BOLD}3. Select Interaction Channel & Scenario:{RESET}")
    print("  [1] WhatsApp Outreach (Rule 1 & 2: Opt-in Consent → Scheduling)")
    print("  [2] Scheduled Voice Call (Rule 3: Straight into Screening Questions)")
    print("  [3] Fallback Voice Call (Rule 4: Unsolicited outbound → Intent Check → Screening)")
    channel_choice = input("Enter choice (1/2/3) [Default 2]: ").strip() or "2"
    
    if channel_choice == "1":
        channel = "WhatsApp"
        is_scheduled = False
    elif channel_choice == "3":
        channel = "Voice"
        is_scheduled = False
    else:
        channel = "Voice"
        is_scheduled = True

    # 4. Candidate Details
    candidate_name = input(f"\nCandidate Name [Default Alex]: ").strip() or "Alex"
    role_name = input(f"Target Role [Default Full Stack Developer]: ").strip() or "Full Stack Developer"
    campaign_brief = f"{role_name} at TechCorp. Remote work."

    # 5. Initialize the Agent
    llm = LLMAgent(
        candidate_name=candidate_name,
        role=role_name,
        campaign_brief=campaign_brief,
        current_channel=channel,
        is_scheduled=is_scheduled,
        questions=questions,
        key_criteria=key_criteria
    )
    llm.is_mock = is_mock
    
    tts = TTSAgent()
    tts.is_mock = is_mock
    
    ranker = RankerAgent()
    ranker.is_mock = is_mock

    # Start Simulation
    print_header(f"SIMULATION RUNNING: {channel} Call to {candidate_name} ({'MOCK' if is_mock else 'REAL GROQ'} MODE)", BLUE)
    
    # Initial Greeting
    greeting = llm.get_initial_greeting()
    print(f"\n{BLUE}[🤖 AI ASSISTANT]:{RESET} \"{greeting}\"")
    
    # If Voice, simulate TTS generation
    if channel == "Voice":
        print(f"{YELLOW}[🔊 TTS Gen Debug]: Generating audio stream chunks...{RESET}")
        chunk_count = 0
        async for chunk in tts.generate_audio_payloads(greeting):
            chunk_count += 1
        print(f"  -> Generated {chunk_count} mu-law audio packets successfully.")

    # Interaction Loop
    while not llm.is_completed:
        print(f"\n{CYAN}{'-'*65}{RESET}")
        print(f"{BOLD}Agent Status:{RESET} Channel={llm.current_channel} | Status={llm.candidate_status} | Stage={llm.fallback_voice_stage} | Next Question Index={llm.current_question_idx}")
        
        user_input = input(f"\n{YELLOW}[👤 CANDIDATE '{candidate_name}' RESPONSE]:{RESET} ").strip()
        if not user_input:
            continue
            
        if user_input.lower() in ["exit", "quit", "hangup", "bye"]:
            print(f"\n{RED}Candidate hung up / ended the conversation.{RESET}")
            break
            
        # Run Brain Agent
        response = await llm.generate_response(user_input)
        print(f"\n{BLUE}[🤖 AI ASSISTANT]:{RESET} \"{response}\"")
        
        # If Voice and conversation is not completed, run TTS
        if channel == "Voice" and not llm.is_completed:
            print(f"{YELLOW}[🔊 TTS Gen Debug]: Generating audio stream chunks...{RESET}")
            chunk_count = 0
            async for chunk in tts.generate_audio_payloads(response):
                chunk_count += 1
            print(f"  -> Generated {chunk_count} mu-law audio packets successfully.")

    # 6. Post-Call Analysis (Ranker Agent)
    print_header("Call Concluded - Post-Call Analysis", MAGENTA)
    print(f"Evaluating transcript of {len(llm.conversation_history)} messages.")
    
    score, dossier = ranker.evaluate_interview(
        conversation_history=llm.conversation_history,
        fluency_scores=llm.fluency_scores,
        off_topic_flags=llm.off_topic_flags
    )
    
    print_header("FINAL DOSSIER GENERATED", GREEN)
    print(f"{BOLD}Candidate AI Score:{RESET} {score}/100")
    print(f"{BOLD}Evaluation Status :{RESET} {llm.candidate_status}")
    print(f"\n{BOLD}Dossier Summary:{RESET}\n{dossier.get('summary', 'No summary generated.')}")
    
    print(f"\n{BOLD}Key Strengths:{RESET}")
    for s in dossier.get("strengths", []):
        print(f"  + {s}")
        
    print(f"\n{BOLD}Key Weaknesses:{RESET}")
    for w in dossier.get("weaknesses", []):
        print(f"  - {w}")
        
    print(f"\n{BOLD}Fluency Rating:{RESET} {dossier.get('avg_fluency_score', 'N/A')}/5")
    if dossier.get("off_topic_flags"):
        print(f"\n{BOLD}Off-Topic Flaunts:{RESET}")
        for flag in dossier.get("off_topic_flags", []):
            print(f"  ! Off-topic on question: \"{flag.get('question')}\"")

    print(f"\n{MAGENTA}{'='*65}{RESET}\n")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nSandbox simulation terminated by user.")
        sys.exit(0)
