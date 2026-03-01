"""
Verdant AI Voice Service
========================
Indian language voice synthesis using Sarvam AI (Bulbul v3).

Features:
- Text-to-Speech in 10+ Indian languages
- Multiple voice personas
- Energy notifications in regional languages
- Accessibility features
- Audio file generation
"""

import base64
import httpx
import io
from typing import Optional, List, Dict, Any, Tuple
from enum import Enum
from pydantic import BaseModel

from app.core.config import get_settings

settings = get_settings()


# ── Supported Languages ────────────────────────────────────────
class IndianLanguage(str, Enum):
    """Supported Indian languages for TTS."""
    HINDI = "hi-IN"
    ENGLISH = "en-IN"
    BENGALI = "bn-IN"
    GUJARATI = "gu-IN"
    KANNADA = "kn-IN"
    MALAYALAM = "ml-IN"
    MARATHI = "mr-IN"
    ODIA = "od-IN"
    PUNJABI = "pa-IN"
    TAMIL = "ta-IN"
    TELUGU = "te-IN"


# ── Voice Personas (Bulbul v3) ─────────────────────────────────
class VoicePersona(str, Enum):
    """Available Sarvam voice personas."""
    # Male voices
    ADITYA = "Aditya"      # Professional male
    RAHUL = "Rahul"        # Casual male
    ROHAN = "Rohan"        # Young male
    SHUBH = "Shubh"        # Deep male
    
    # Female voices
    PRIYA = "Priya"        # Professional female
    RITU = "Ritu"          # Warm female
    NEHA = "Neha"          # Energetic female
    POOJA = "Pooja"        # Soft female
    SIMRAN = "Simran"      # Young female
    KAVYA = "Kavya"        # Mature female


# ── Models ─────────────────────────────────────────────────────
class TTSRequest(BaseModel):
    text: str
    language: IndianLanguage = IndianLanguage.HINDI
    speaker: VoicePersona = VoicePersona.ADITYA
    pitch: float = 0.0  # -1.0 to 1.0
    pace: float = 1.0   # 0.5 to 2.0
    loudness: float = 1.0  # 0.5 to 2.0


class TTSResponse(BaseModel):
    audio_base64: str
    audio_format: str = "wav"
    duration_seconds: float
    language: str
    speaker: str


class TranslationRequest(BaseModel):
    text: str
    source_language: IndianLanguage = IndianLanguage.ENGLISH
    target_language: IndianLanguage = IndianLanguage.HINDI


# ── Sarvam API Client ──────────────────────────────────────────
class SarvamClient:
    """Sarvam AI API client for TTS and translation."""
    
    BASE_URL = "https://api.sarvam.ai"
    TTS_ENDPOINT = "/text-to-speech"
    TRANSLATE_ENDPOINT = "/translate"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "api-subscription-key": api_key,
            "Content-Type": "application/json"
        }
    
    async def text_to_speech(
        self,
        text: str,
        language: str = "hi-IN",
        speaker: str = "Aditya",
        pitch: float = 0.0,
        pace: float = 1.0,
        loudness: float = 1.0,
        model: str = "bulbul:v1"
    ) -> Dict[str, Any]:
        """
        Convert text to speech using Sarvam Bulbul model.
        
        Returns:
            Dict with 'audios' list containing base64 encoded audio
        """
        payload = {
            "inputs": [text],
            "target_language_code": language,
            "speaker": speaker,
            "pitch": pitch,
            "pace": pace,
            "loudness": loudness,
            "speech_sample_rate": 22050,
            "enable_preprocessing": True,
            "model": model
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.BASE_URL}{self.TTS_ENDPOINT}",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()
    
    async def translate(
        self,
        text: str,
        source_language: str = "en-IN",
        target_language: str = "hi-IN"
    ) -> Dict[str, Any]:
        """
        Translate text between Indian languages.
        """
        payload = {
            "input": text,
            "source_language_code": source_language,
            "target_language_code": target_language,
            "speaker_gender": "Male",
            "mode": "formal",
            "model": "mayura:v1"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.BASE_URL}{self.TRANSLATE_ENDPOINT}",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()


# ── Voice Templates for Energy Platform ────────────────────────
VOICE_TEMPLATES = {
    "welcome": {
        "en-IN": "Welcome to Verdant Energy Platform. Your gateway to clean, green energy trading.",
        "hi-IN": "वर्डेंट एनर्जी प्लेटफॉर्म में आपका स्वागत है। स्वच्छ, हरित ऊर्जा व्यापार का आपका द्वार।",
        "mr-IN": "वर्डेंट एनर्जी प्लॅटफॉर्मवर आपले स्वागत आहे। स्वच्छ, हरित ऊर्जा व्यापाराचे तुमचे द्वार.",
        "ta-IN": "வெர்டண்ட் எனர்ஜி பிளாட்ஃபார்மிற்கு வரவேற்கிறோம். தூய்மையான, பசுமை ஆற்றல் வர்த்தகத்திற்கான உங்கள் வாயில்.",
        "te-IN": "వర్దంత్ ఎనర్జీ ప్లాట్‌ఫారమ్‌కు స్వాగతం. శుభ్రమైన, పచ్చ శక్తి వ్యాపారానికి మీ ద్వారం."
    },
    "contract_created": {
        "en-IN": "Congratulations! Your energy contract has been successfully created. You are now contributing to a greener India.",
        "hi-IN": "बधाई हो! आपका ऊर्जा अनुबंध सफलतापूर्वक बन गया है। अब आप एक हरित भारत में योगदान दे रहे हैं।"
    },
    "payment_success": {
        "en-IN": "Payment successful! Amount of {amount} rupees has been processed. Thank you for choosing green energy.",
        "hi-IN": "भुगतान सफल! {amount} रुपये की राशि संसाधित हो गई है। हरित ऊर्जा चुनने के लिए धन्यवाद।"
    },
    "price_alert": {
        "en-IN": "Price Alert! {energy_type} energy prices are now at {price} rupees per unit. This is {change}% {direction} from yesterday.",
        "hi-IN": "मूल्य सूचना! {energy_type} ऊर्जा की कीमत अब {price} रुपये प्रति यूनिट है। यह कल से {change}% {direction} है।"
    },
    "certificate_earned": {
        "en-IN": "Congratulations! You have earned a new Green Energy Certificate. You have saved {carbon} kilograms of carbon emissions.",
        "hi-IN": "बधाई हो! आपने एक नया हरित ऊर्जा प्रमाणपत्र अर्जित किया है। आपने {carbon} किलोग्राम कार्बन उत्सर्जन बचाया है।"
    },
    "daily_summary": {
        "en-IN": "Good {time_of_day}! Your daily energy summary: You consumed {consumption} kilowatt hours today. {comparison} yesterday.",
        "hi-IN": "शुभ {time_of_day}! आपका दैनिक ऊर्जा सारांश: आपने आज {consumption} किलोवाट घंटे उपभोग किया। कल की तुलना में {comparison}।"
    }
}


# ── AI Voice Service ───────────────────────────────────────────
class AIVoiceService:
    """
    AI Voice service for Indian language TTS.
    Uses Sarvam AI Bulbul model.
    """
    
    def __init__(self):
        self.client = SarvamClient(settings.SARVAM_API_KEY) if settings.SARVAM_API_KEY else None
        self.default_speaker = VoicePersona(settings.SARVAM_DEFAULT_SPEAKER)
        self.default_language = IndianLanguage.HINDI
    
    @property
    def is_available(self) -> bool:
        """Check if voice service is available."""
        return self.client is not None
    
    async def speak(
        self,
        text: str,
        language: IndianLanguage = None,
        speaker: VoicePersona = None,
        pitch: float = 0.0,
        pace: float = 1.0
    ) -> TTSResponse:
        """
        Convert text to speech.
        
        Args:
            text: Text to convert to speech
            language: Target language (default: Hindi)
            speaker: Voice persona (default: from settings)
            pitch: Voice pitch adjustment
            pace: Speech pace
        
        Returns:
            TTSResponse with base64 audio
        """
        if not self.client:
            raise RuntimeError("Sarvam API key not configured")
        
        language = language or self.default_language
        speaker = speaker or self.default_speaker
        
        response = await self.client.text_to_speech(
            text=text,
            language=language.value,
            speaker=speaker.value,
            pitch=pitch,
            pace=pace
        )
        
        # Extract audio from response
        if "audios" in response and response["audios"]:
            audio_base64 = response["audios"][0]
            # Estimate duration (rough calculation)
            audio_bytes = len(base64.b64decode(audio_base64))
            duration = audio_bytes / (22050 * 2)  # 22050 Hz, 16-bit
            
            return TTSResponse(
                audio_base64=audio_base64,
                audio_format="wav",
                duration_seconds=round(duration, 2),
                language=language.value,
                speaker=speaker.value
            )
        
        raise RuntimeError("No audio generated")
    
    async def speak_notification(
        self,
        notification_type: str,
        language: IndianLanguage = None,
        params: Optional[Dict] = None
    ) -> TTSResponse:
        """
        Speak a pre-defined notification.
        
        Args:
            notification_type: Type from VOICE_TEMPLATES
            language: Target language
            params: Parameters to fill in template
        
        Returns:
            TTSResponse with audio
        """
        language = language or self.default_language
        lang_code = language.value
        
        # Get template
        templates = VOICE_TEMPLATES.get(notification_type, {})
        text = templates.get(lang_code) or templates.get("en-IN", "Notification")
        
        # Fill in parameters
        if params:
            text = text.format(**params)
        
        return await self.speak(text, language)
    
    async def welcome_user(
        self,
        user_name: str,
        language: IndianLanguage = IndianLanguage.HINDI
    ) -> TTSResponse:
        """Generate personalized welcome message."""
        if language == IndianLanguage.HINDI:
            text = f"नमस्ते {user_name}! वर्डेंट एनर्जी प्लेटफॉर्म में आपका स्वागत है।"
        else:
            text = f"Hello {user_name}! Welcome to Verdant Energy Platform."
        
        return await self.speak(text, language)
    
    async def announce_price_change(
        self,
        energy_type: str,
        new_price: float,
        change_percent: float,
        language: IndianLanguage = IndianLanguage.HINDI
    ) -> TTSResponse:
        """Announce energy price change."""
        direction = "बढ़ा" if change_percent > 0 else "घटा" if language == IndianLanguage.HINDI else "increased" if change_percent > 0 else "decreased"
        
        return await self.speak_notification(
            "price_alert",
            language,
            {
                "energy_type": energy_type,
                "price": new_price,
                "change": abs(change_percent),
                "direction": direction
            }
        )
    
    async def congratulate_certificate(
        self,
        carbon_saved_kg: float,
        language: IndianLanguage = IndianLanguage.HINDI
    ) -> TTSResponse:
        """Congratulate user on earning certificate."""
        return await self.speak_notification(
            "certificate_earned",
            language,
            {"carbon": carbon_saved_kg}
        )
    
    async def daily_summary(
        self,
        consumption_kwh: float,
        yesterday_kwh: float,
        language: IndianLanguage = IndianLanguage.HINDI
    ) -> TTSResponse:
        """Generate daily consumption summary."""
        from datetime import datetime
        hour = datetime.now().hour
        
        if hour < 12:
            time_of_day = "प्रभात" if language == IndianLanguage.HINDI else "morning"
        elif hour < 17:
            time_of_day = "दोपहर" if language == IndianLanguage.HINDI else "afternoon"
        else:
            time_of_day = "संध्या" if language == IndianLanguage.HINDI else "evening"
        
        diff = consumption_kwh - yesterday_kwh
        if diff > 0:
            comparison = f"{abs(diff):.1f} अधिक" if language == IndianLanguage.HINDI else f"{abs(diff):.1f} more than"
        else:
            comparison = f"{abs(diff):.1f} कम" if language == IndianLanguage.HINDI else f"{abs(diff):.1f} less than"
        
        return await self.speak_notification(
            "daily_summary",
            language,
            {
                "time_of_day": time_of_day,
                "consumption": consumption_kwh,
                "comparison": comparison
            }
        )
    
    async def translate_and_speak(
        self,
        text: str,
        source_language: IndianLanguage = IndianLanguage.ENGLISH,
        target_language: IndianLanguage = IndianLanguage.HINDI
    ) -> TTSResponse:
        """Translate text and convert to speech."""
        if not self.client:
            raise RuntimeError("Sarvam API key not configured")
        
        # Translate first
        translation = await self.client.translate(
            text=text,
            source_language=source_language.value,
            target_language=target_language.value
        )
        
        translated_text = translation.get("translated_text", text)
        
        # Convert to speech
        return await self.speak(translated_text, target_language)
    
    def get_available_voices(self) -> List[Dict]:
        """Get list of available voice personas."""
        return [
            {"id": v.value, "name": v.value, "gender": "male" if v in [VoicePersona.ADITYA, VoicePersona.RAHUL, VoicePersona.ROHAN, VoicePersona.SHUBH] else "female"}
            for v in VoicePersona
        ]
    
    def get_supported_languages(self) -> List[Dict]:
        """Get list of supported languages."""
        return [
            {"code": l.value, "name": l.name.replace("_", " ").title()}
            for l in IndianLanguage
        ]


# ── Singleton Instance ─────────────────────────────────────────
_voice_service: Optional[AIVoiceService] = None


def get_ai_voice() -> AIVoiceService:
    """Get or create AI Voice singleton."""
    global _voice_service
    if _voice_service is None:
        _voice_service = AIVoiceService()
    return _voice_service


# ── Quick Access Functions ─────────────────────────────────────
async def text_to_speech(
    text: str,
    language: IndianLanguage = IndianLanguage.HINDI
) -> TTSResponse:
    """Quick TTS conversion."""
    voice = get_ai_voice()
    return await voice.speak(text, language)


async def speak_hindi(text: str) -> TTSResponse:
    """Quick Hindi TTS."""
    voice = get_ai_voice()
    return await voice.speak(text, IndianLanguage.HINDI)


async def speak_english(text: str) -> TTSResponse:
    """Quick English TTS."""
    voice = get_ai_voice()
    return await voice.speak(text, IndianLanguage.ENGLISH)
