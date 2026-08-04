import asyncio
import os
import sys
from dotenv import load_dotenv

# Ensure python_service root is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')


async def test_groq_llm():
    print("==================================================")
    print("Testing Groq Cloud LLM Agent (llama-3.3-70b-versatile)...")
    print("==================================================")
    
    from agents.llm_agent import LLMAgent
    from config import LLM_PROVIDER, GROQ_LLM_MODEL, GROQ_API_KEY
    
    print(f"Active Provider: {LLM_PROVIDER}")
    print(f"Target Groq Model: {GROQ_LLM_MODEL}")
    
    if not GROQ_API_KEY or GROQ_API_KEY.startswith("gsk_your"):
        print("❌ Error: Valid GROQ_API_KEY is required in .env file to run Groq tests.")
        return

    agent = LLMAgent(
        candidate_name="Alex Mercer",
        campaign_brief="Senior Full Stack Engineer",
        questions=["Can you describe a complex React application you designed?"],
        key_criteria=["5+ years of React & Node.js experience", "State management expertise"],
        current_channel="Voice",
        is_scheduled=True
    )
    
    greeting = agent.get_initial_greeting()
    print(f"\n[AI Recruiter Greeting]: {greeting}")
    
    candidate_response = "I built a large scale SaaS dashboard using React, Redux Toolkit, and WebSockets for real-time updates."
    print(f"\n[Candidate Input]: {candidate_response}")
    
    print("\nSending response to Groq LLM Agent...")
    reply = await agent.generate_response(candidate_response)
    
    print(f"\n[AI Recruiter Reply]: {reply}")
    print(f"Interview Completed: {agent.is_completed}")
    print("==================================================")
    print("✅ Groq LLM Agent Test Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(test_groq_llm())
