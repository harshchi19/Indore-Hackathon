"""Test AI Chat Functionality"""
import asyncio
from app.services.ai_assistant import chat_with_assistant, get_energy_tip

async def test_chat():
    print("="*60)
    print("VERDANT AI ASSISTANT TEST")
    print("="*60)
    
    # Test 1: Simple chat
    print("\n1. Testing Chat...")
    response = await chat_with_assistant(
        user_id="test-user",
        message="What is the current price of solar energy in India?"
    )
    print(f"   Provider: {response.provider} ({response.model})")
    print(f"   Tokens: {response.tokens_used}")
    print(f"   Response: {response.message[:200]}...")
    print(f"   Suggestions: {response.suggestions}")
    
    # Test 2: Energy tip
    print("\n2. Getting Energy Tip...")
    tip = await get_energy_tip()
    print(f"   Tip: {tip}")
    
    print("\n" + "="*60)
    print("AI TEST COMPLETED!")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(test_chat())
