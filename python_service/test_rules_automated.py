import asyncio
from agents.llm_agent import LLMAgent

async def test_rule1_and_rule2():
    print("=== Testing Rule 1 & Rule 2 (WhatsApp Outreach & Scheduling) ===")
    agent = LLMAgent(
        candidate_name="Sarah Jenkins",
        campaign_brief="Senior Full-Stack Developer at TechCorp position",
        scheduling_link="https://calendly.com/techcorp-hr/screening",
        hr_deadline_days=3,
        current_channel="WhatsApp",
        is_scheduled=False
    )
    agent.is_mock = True

    # Rule 1: Initial greeting
    greeting = agent.get_initial_greeting()
    assert "Sarah Jenkins" in greeting
    assert "Senior Full-Stack Developer at TechCorp" in greeting
    assert "https://calendly.com" not in greeting  # No link yet in Rule 1
    print("Rule 1 Initial Greeting OK:", greeting)

    # Rule 2: Candidate replies yes
    reply = await agent.generate_response("Yes, I'm interested!")
    assert "https://calendly.com/techcorp-hr/screening" in reply
    assert "3 days" in reply
    assert agent.candidate_status == "SCHEDULED"
    print("Rule 2 Scheduling Link OK:", reply)

async def test_rule3():
    print("\n=== Testing Rule 3 (Scheduled Voice Call) ===")
    agent = LLMAgent(
        candidate_name="Alex Johnson",
        campaign_brief="Senior React Developer at TechCorp position",
        scheduling_link="https://calendly.com/techcorp-hr/screening",
        hr_deadline_days=3,
        current_channel="Voice",
        is_scheduled=True,
        questions=["Tell me about your React experience.", "What is your notice period?"]
    )
    agent.is_mock = True

    greeting = agent.get_initial_greeting()
    assert "Alex Johnson" in greeting
    assert "scheduled call" in greeting
    assert "Tell me about your React experience" in greeting
    print("Rule 3 Scheduled Greeting OK:", greeting)

async def test_rule4_interested():
    print("\n=== Testing Rule 4 (Fallback Voice Call - Interested) ===")
    agent = LLMAgent(
        candidate_name="Michael Scott",
        campaign_brief="Regional Director position",
        scheduling_link="https://calendly.com/techcorp-hr/screening",
        hr_deadline_days=3,
        current_channel="Voice",
        is_scheduled=False,
        questions=["What is your leadership style?"]
    )
    agent.is_mock = True

    # Initial fallback greeting
    greeting = agent.get_initial_greeting()
    assert "following up on a WhatsApp message" in greeting
    print("Rule 4 Initial Greeting OK:", greeting)

    # Turn 1: Candidate says yes to having a minute
    r1 = await agent.generate_response("Yes, I have a minute.")
    assert "interested" in r1.lower()
    print("Rule 4 Minute Check OK:", r1)

    # Turn 2: Candidate says interested
    r2 = await agent.generate_response("Yes, I am interested.")
    assert "screening questions" in r2.lower()
    assert "What is your leadership style?" in r2
    assert agent.candidate_status == "INTERESTED"
    print("Rule 4 Interest Transition OK:", r2)

async def test_rule4_declined():
    print("\n=== Testing Rule 4 (Fallback Voice Call - Declined) ===")
    agent = LLMAgent(
        candidate_name="Dwight Schrute",
        campaign_brief="Assistant to Regional Manager position",
        scheduling_link="https://calendly.com/techcorp-hr/screening",
        hr_deadline_days=3,
        current_channel="Voice",
        is_scheduled=False
    )
    agent.is_mock = True

    greeting = agent.get_initial_greeting()
    r1 = await agent.generate_response("No, I'm busy right now and not interested.")
    assert agent.candidate_status == "DECLINED"
    assert agent.is_completed == True
    print("Rule 4 Decline OK:", r1)

async def main():
    await test_rule1_and_rule2()
    await test_rule3()
    await test_rule4_interested()
    await test_rule4_declined()
    print("\nALL AUTOMATED RULE VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(main())

