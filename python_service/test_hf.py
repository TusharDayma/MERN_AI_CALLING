import sys
import os

print("Note: Hugging Face model integration has been migrated to Groq Cloud API.")
print("Running Groq LLM Agent test script...\n")

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from test_groq import test_groq_llm
import asyncio

if __name__ == "__main__":
    asyncio.run(test_groq_llm())
