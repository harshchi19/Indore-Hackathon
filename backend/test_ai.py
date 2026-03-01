"""Test AI modules"""
from app.services.ai_assistant import get_ai_assistant
from app.services.ai_analytics import get_ai_analytics
from app.services.ai_voice import get_ai_voice

print("Testing AI Services...")
print()

# Test assistant
assistant = get_ai_assistant()
print("AI Assistant:")
print(f"  Groq: {'Available' if assistant.groq else 'Not configured'}")
print(f"  Gemini: {'Available' if assistant.gemini else 'Not configured'}")

# Test analytics
analytics = get_ai_analytics()
print()
print("AI Analytics:")
print(f"  Gemini: {'Available' if analytics.gemini else 'Not configured'}")

# Test voice
voice = get_ai_voice()
print()
print("AI Voice:")
print(f"  Sarvam: {'Available' if voice.is_available else 'Not configured'}")
print(f"  Languages: {len(voice.get_supported_languages())}")
print(f"  Voices: {len(voice.get_available_voices())}")

print()
print("All AI modules loaded successfully!")
