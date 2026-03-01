"""Test Sarvam TTS API"""
import httpx
import asyncio
from app.core.config import get_settings

settings = get_settings()

async def test():
    # Minimal payload
    payload = {
        "inputs": ["Hello"],
        "target_language_code": "hi-IN",
        "speaker": "meera",
        "model": "bulbul:v1"
    }
    headers = {
        "api-subscription-key": settings.SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post("https://api.sarvam.ai/text-to-speech", headers=headers, json=payload)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"Success! Audio length: {len(data.get('audios', [[]])[0])} chars")
        else:
            print(f"Error: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test())
