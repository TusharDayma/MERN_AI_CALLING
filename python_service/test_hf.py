import asyncio
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

async def test_llm():
    print("Testing Hugging Face LLM Agent...")
    from agents.llm_agent import LLMAgent
    
    agent = LLMAgent(
        candidate_name="Test User",
        campaign_brief="Senior Developer",
        questions=["What is your experience in Python?"],
        key_criteria=["5 years of Python"]
    )
    
    greeting = agent.get_initial_greeting()
    print(f"\nAI: {greeting}")
    
    response = await agent.generate_response("I have 6 years of Python experience.")
    print(f"\nAI: {response}")
    print("\nTest Complete!")

if __name__ == "__main__":
    if os.getenv("LLM_PROVIDER") != "huggingface":
        print("Please set LLM_PROVIDER=huggingface in your .env file.")
    elif not os.getenv("HF_API_KEY") or os.getenv("HF_API_KEY") == "hf_your_api_key_here":
        print("Please set a valid HF_API_KEY in your .env file.")
    else:
        asyncio.run(test_llm())
