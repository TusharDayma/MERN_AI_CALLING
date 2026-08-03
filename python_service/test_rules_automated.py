import asyncio
from agents.recruitment_assistant import RecruitmentAssistant

async def test_rule1_and_rule2():
    print("=== Testing Rule 1 & Rule 2 (WhatsApp Outreach & Scheduling) ===")
    assistant = RecruitmentAssistant(
        candidate_name="Sarah Jenkins",
        campaign_brief="Senior Full-Stack Developer at TechCorp",
        scheduling_link="https://calendly.com/techcorp-hr/screening",
        hr_deadline_days=3,
        current_channel="WhatsApp",
        is_scheduled=False
    )
    assistant.agent.is_mock = True

    # Rule 1: Initial greeting
    greeting = assistant.start_conversation()
    assert "Sarah Jenkins" in greeting
    assert "Senior Full-Stack Developer at TechCorp" in greeting
    assert "https://calendly.com" not in greeting  # No link yet in Rule 1
    print("Rule 1 Initial Greeting OK:", greeting)

    # Rule 2: Candidate replies yes
    reply = await assistant.handle_whatsapp_message("Yes, I'm interested!")
    assert "https://calendly.com/techcorp-hr/screening" in reply
    assert "3 days" in reply
    assert assistant.agent.candidate_status == "SCHEDULED"
    print("Rule 2 Scheduling Link OK:", reply)

async def test_rule3():
    print("\n=== Testing Rule 3 (Scheduled Voice Call) ===")
    assistant = RecruitmentAssistant(
        candidate_name="Alex Johnson",
        campaign_brief="Senior React Developer at TechCorp",
        scheduling_link="https://calendly.com/techcorp-hr/screening",
        hr_deadline_days=3,
        current_channel="Voice",
        is_scheduled=True,
        questions=["Tell me about your React experience.", "What is your notice period?"]
    )
    assistant.agent.is_mock = True

    greeting = assistant.start_conversation()
    assert "Alex Johnson" in greeting
    assert "scheduled call" in greeting
    assert "Tell me about your React experience" in greeting
    print("Rule 3 Scheduled Greeting OK:", greeting)

async def test_rule4_interested():
    print("\n=== Testing Rule 4 (Fallback Voice Call - Interested) ===")
    assistant = RecruitmentAssistant(
        candidate_name="Michael Scott",
        campaign_brief="Regional Director",
        scheduling_link="https://calendly.com/techcorp-hr/screening",
        hr_deadline_days=3,
        current_channel="Voice",
        is_scheduled=False,
        questions=["What is your leadership style?"]
    )
    assistant.agent.is_mock = True

    # Initial fallback greeting
    greeting = assistant.start_conversation()
    assert "following up on a WhatsApp message" in greeting
    print("Rule 4 Initial Greeting OK:", greeting)

    # Turn 1: Candidate says yes to having a minute
    r1 = await assistant.handle_voice_turn("Yes, I have a minute.")
    assert "interested" in r1.lower()
    print("Rule 4 Minute Check OK:", r1)

    # Turn 2: Candidate says interested
    r2 = await assistant.handle_voice_turn("Yes, I am interested.")
    assert "screening questions" in r2.lower()
    assert "What is your leadership style?" in r2
    assert assistant.agent.candidate_status == "INTERESTED"
    print("Rule 4 Interest Transition OK:", r2)

async def test_rule4_declined():
    print("\n=== Testing Rule 4 (Fallback Voice Call - Declined) ===")
    assistant = RecruitmentAssistant(
        candidate_name="Dwight Schrute",
        campaign_brief="Assistant to Regional Manager",
        scheduling_link="https://calendly.com/techcorp-hr/screening",
        hr_deadline_days=3,
        current_channel="Voice",
        is_scheduled=False
    )
    assistant.agent.is_mock = True

    greeting = assistant.start_conversation()
    r1 = await assistant.handle_voice_turn("No, I'm busy right now and not interested.")
    assert assistant.agent.candidate_status == "DECLINED"
    assert assistant.agent.is_completed == True
    print("Rule 4 Decline OK:", r1)

async def main():
    await test_rule1_and_rule2()
    await test_rule3()
    await test_rule4_interested()
    await test_rule4_declined()
    print("\nALL AUTOMATED RULE VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(main())
