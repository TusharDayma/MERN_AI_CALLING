import os
import sys
import asyncio
import json

# Ensure we can import from the agents folder
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.llm_agent import LLMAgent
from agents.ranker_agent import RankerAgent
from config import BRAIN_MODEL, RANKER_MODEL

# 1. Define the default HR Campaign data
MOCK_CAMPAIGN = {
    "role": "Senior React Developer",
    "questions": [
        "Explain the virtual DOM and how React uses reconciliation.",
        "When would you use useMemo versus useCallback in React?",
        "How do you handle state management across a complex React application?"
    ],
    "key_criteria": [
        "Must explain the virtual DOM concept, diffing algorithm, and updating the real DOM.",
        "Must state that useMemo is for memoizing values, and useCallback is for memoizing callback functions to prevent unnecessary child re-renders.",
        "Must discuss Context API, Redux/Zustand, component state, and when to use local vs global state."
    ]
}

def print_header(title):
    print("=" * 60)
    print(f" {title} ".center(60, "="))
    print("=" * 60)

async def main():
    print_header("AntiTalk AI Multi-Agent Pipeline Local Tester")
    
    # 2. Setup run mode (Mock vs Real Ollama)
    print(f"Current Models - Brain: '{BRAIN_MODEL}', Ranker: '{RANKER_MODEL}'")
    mode = input("Run tests with [R]eal Ollama or [M]ock Agents? (R/M): ").strip().upper()
    
    is_mock = True
    if mode == 'R':
        # Verify if ollama is installed and running
        try:
            import ollama
            print("Checking Ollama status...")
            ollama.list()
            is_mock = False
            print("Ollama connection successful. Real agents will be used.")
        except ImportError:
            print("WARNING: 'ollama' package is not installed. Run 'pip install ollama' first.")
            print("Defaulting to Mock Agents.")
        except Exception as e:
            print(f"WARNING: Could not connect to local Ollama daemon: {e}")
            print("Ensure Ollama is running (`ollama run llama3`).")
            print("Defaulting to Mock Agents.")
    else:
        print("Using Mock Agents.")

    # 3. Initialize Agent 3 (LLM) and Agent 4 (Ranker)
    llm = LLMAgent(
        role=MOCK_CAMPAIGN["role"],
        questions=MOCK_CAMPAIGN["questions"],
        key_criteria=MOCK_CAMPAIGN["key_criteria"]
    )
    llm.is_mock = is_mock
    
    ranker = RankerAgent()
    ranker.is_mock = is_mock

    print_header("Interview Started")
    print(f"Role: {MOCK_CAMPAIGN['role']}")
    print(f"Total Questions: {len(MOCK_CAMPAIGN['questions'])}")
    print("-" * 60)
    
    # Simulate Agent 1 (TTS) playing the initial greeting
    greeting = "Hello, this is the AntiTalk AI. Thank you for joining this interview. How are you doing today?"
    print(f"\n[Agent 1 (TTS) Output]:\n>>> \"{greeting}\"\n")

    # Start the interview loop
    while llm.current_question_idx < len(llm.questions):
        # Simulate Agent 2 (STT) via user input
        print("-" * 60)
        user_input = input("[Agent 2 (STT) Input - Candidate Response]:\n<<< ")
        if user_input.strip().lower() in ['exit', 'quit', 'hangup']:
            print("\nCall hung up by candidate.")
            break
            
        print("\n[Thinking...] calling Agent 3 (Live Brain / LLM)...")
        # Run the LLM Agent to get the response
        response = await llm.generate_response(user_input)
        
        # Simulate Agent 1 (TTS) playing the generated response
        print(f"\n[Agent 1 (TTS) Output]:\n>>> \"{response}\"\n")
        
        # Print status of internal loop
        print(f"--- Internals: Question Index: {llm.current_question_idx}/{len(llm.questions)} | Attempt: {llm.attempts} ---")

    print_header("Call Completed - Launching Post-Call Analysis")
    print("Calling Agent 4 (Analyst / Ranker)...")
    
    # Run Agent 4 (Ranker) on the transcript
    score, dossier = ranker.evaluate_interview(llm.conversation_history)
    
    print_header("Agent 4 (Analyst) Evaluation Results")
    print(f"Candidate Score: {score}/100")
    print("\nFormatted Dossier JSON:")
    print(json.dumps(dossier, indent=2))
    print("=" * 60)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTest execution interrupted.")
        sys.exit(0)
