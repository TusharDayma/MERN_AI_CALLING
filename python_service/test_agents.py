import os
import sys
import asyncio
import json

# Ensure we can import from the agents folder
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.recruitment_assistant import RecruitmentAssistant
from agents.ranker_agent import RankerAgent
from config import BRAIN_MODEL, RANKER_MODEL

MOCK_CAMPAIGN = {
    "candidate_name": "Alex Johnson",
    "role": "Senior Full-Stack Developer",
    "campaign_brief": "Senior Full-Stack Developer at TechCorp. Building scalable Node.js microservices and React dashboards (Remote).",
    "scheduling_link": "https://calendly.com/techcorp-hr/screening",
    "hr_deadline_days": 3,
    "questions": [
        "Could you briefly describe your experience with Node.js microservices?",
        "What is your current notice period and location preference?"
    ],
    "key_criteria": [
        "Must mention architecture experience with Node.js.",
        "Must specify notice period in days/months."
    ]
}

def print_header(title):
    print("=" * 60)
    print(f" {title} ".center(60, "="))
    print("=" * 60)

async def main():
    print_header("AntiTalk AI Recruitment Assistant Tester")
    print(f"Current Models - Brain: '{BRAIN_MODEL}', Ranker: '{RANKER_MODEL}'")
    
    mode = input("Run tests with [R]eal Ollama or [M]ock Agents? (R/M): ").strip().upper()
    is_mock = (mode != 'R')

    if not is_mock:
        try:
            import ollama
            ollama.list()
            print("Ollama connection successful. Real agents active.")
        except Exception as e:
            print(f"WARNING: Could not connect to Ollama ({e}). Defaulting to Mock Agents.")
            is_mock = True

    print("\nSelect Interaction Rule to test:")
    print("1. Rule 1 & 2: WhatsApp Outreach & Scheduling")
    print("2. Rule 3: Scheduled Voice Call")
    print("3. Rule 4: Fallback Voice Call (Unsolicited)")
    choice = input("Enter choice (1/2/3) [Default 2]: ").strip() or "2"

    if choice == "1":
        channel = "WhatsApp"
        is_scheduled = False
    elif choice == "3":
        channel = "Voice"
        is_scheduled = False
    else:
        channel = "Voice"
        is_scheduled = True

    assistant = RecruitmentAssistant(
        candidate_name=MOCK_CAMPAIGN["candidate_name"],
        campaign_brief=MOCK_CAMPAIGN["campaign_brief"],
        scheduling_link=MOCK_CAMPAIGN["scheduling_link"],
        hr_deadline_days=MOCK_CAMPAIGN["hr_deadline_days"],
        current_channel=channel,
        is_scheduled=is_scheduled,
        questions=MOCK_CAMPAIGN["questions"],
        key_criteria=MOCK_CAMPAIGN["key_criteria"]
    )
    assistant.agent.is_mock = is_mock

    ranker = RankerAgent()
    ranker.is_mock = is_mock

    print_header("Conversation Started")
    print(f"Channel: {channel} | Scheduled: {is_scheduled}")
    print(f"Candidate: {MOCK_CAMPAIGN['candidate_name']}")
    print("-" * 60)

    # Initial outreach / greeting
    greeting = assistant.start_conversation()
    print(f"\n[AI Assistant Output]:\n>>> \"{greeting}\"\n")

    # Conversation Loop
    while not assistant.agent.is_completed:
        print("-" * 60)
        user_input = input(f"[{channel} Candidate Response]:\n<<< ")
        if user_input.strip().lower() in ['exit', 'quit', 'hangup']:
            print("\nConversation ended by candidate.")
            break

        response = await assistant.agent.generate_response(user_input)
        print(f"\n[AI Assistant Output]:\n>>> \"{response}\"\n")
        print(f"--- Internals: Status='{assistant.agent.candidate_status}', Question Index={assistant.agent.current_question_idx}/{len(assistant.agent.questions)} ---")

    if channel == "Voice" and assistant.agent.candidate_status in ["COMPLETED", "INTERESTED", "SCHEDULED"]:
        print_header("Call Completed - Launching Post-Call Analysis")
        score, dossier = ranker.evaluate_interview(assistant.agent.conversation_history)
        print_header("Evaluation Results")
        print(f"Candidate AI Score: {score}/100")
        print("\nFormatted Dossier:")
        print(json.dumps(dossier, indent=2))
        print("=" * 60)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTest execution interrupted.")
        sys.exit(0)
