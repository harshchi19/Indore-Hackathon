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
    """Available Sarvam voice personas for Bulbul v3."""
    # Female voices
    ANUSHKA = "anushka"
    MANISHA = "manisha"
    VIDYA = "vidya"
    ARYA = "arya"
    RITU = "ritu"
    PRIYA = "priya"
    NEHA = "neha"
    POOJA = "pooja"
    SIMRAN = "simran"
    KAVYA = "kavya"
    ISHITA = "ishita"
    SHREYA = "shreya"
    ROOPA = "roopa"
    KAVITHA = "kavitha"
    SHRUTI = "shruti"
    SUHANI = "suhani"
    TANYA = "tanya"
    AMELIA = "amelia"
    SOPHIA = "sophia"
    RUPALI = "rupali"

    # Male voices
    ABHILASH = "abhilash"
    KARUN = "karun"
    HITESH = "hitesh"
    ADITYA = "aditya"
    RAHUL = "rahul"
    ROHAN = "rohan"
    AMIT = "amit"
    DEV = "dev"
    RATAN = "ratan"
    VARUN = "varun"
    MANAN = "manan"
    SUMIT = "sumit"
    KABIR = "kabir"
    AAYAN = "aayan"
    SHUBH = "shubh"
    ASHUTOSH = "ashutosh"
    ADVAIT = "advait"
    ANAND = "anand"
    TARUN = "tarun"
    SUNNY = "sunny"
    MANI = "mani"
    GOKUL = "gokul"
    VIJAY = "vijay"
    MOHIT = "mohit"
    REHAN = "rehan"
    SOHAM = "soham"


# ── Models ─────────────────────────────────────────────────────
class TTSRequest(BaseModel):
    text: str
    language: IndianLanguage = IndianLanguage.HINDI
    speaker: VoicePersona = VoicePersona.PRIYA
    pitch: float = 0.0  # -1.0 to 1.0
    pace: float = 1.0   # 0.5 to 2.0
    loudness: float = 1.0  # 0.5 to 2.0


class TTSResponse(BaseModel):
    audio_base64: str
    audio_format: str = "mp3"
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
    TTS_ENDPOINT = "/text-to-speech/stream"  # New streaming endpoint
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
        speaker: str = "priya",
        pitch: float = 0.0,
        pace: float = 1.0,
        loudness: float = 1.0,
        model: str = "bulbul:v3"
    ) -> Dict[str, Any]:
        """
        Convert text to speech using Sarvam Bulbul v3 streaming endpoint.
        
        The streaming endpoint returns raw MP3 bytes.
        We encode them to base64 and return in our standard format.
        """
        payload = {
            "text": text,
            "target_language_code": language,
            "speaker": speaker.lower(),
            "model": model,
            "pace": pace,
            "speech_sample_rate": 22050,
            "output_audio_codec": "mp3",
            "enable_preprocessing": True
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.BASE_URL}{self.TTS_ENDPOINT}",
                headers=self.headers,
                json=payload
            )
            if not response.is_success:
                error_body = response.text
                raise RuntimeError(f"Sarvam API error {response.status_code}: {error_body}")
            
            # Streaming endpoint returns raw audio bytes (MP3)
            audio_bytes = response.content
            if not audio_bytes or len(audio_bytes) < 100:
                raise RuntimeError(f"Sarvam API returned empty or too-small audio ({len(audio_bytes)} bytes)")
            
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            # Estimate duration: MP3 at ~128kbps = 16KB/s
            duration = len(audio_bytes) / 16000
            
            return {
                "audio_base64": audio_base64,
                "audio_format": "mp3",
                "duration_seconds": round(duration, 2),
                "language": language,
                "speaker": speaker
            }
    
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
        "en-IN": "Welcome to GreenGrid! I'm your AI assistant for clean, green energy trading. Let's make India greener together.",
        "hi-IN": "ग्रीनग्रिड में आपका स्वागत है! मैं आपका एआई असिस्टेंट हूं, स्वच्छ, हरित ऊर्जा व्यापार के लिए। आइए मिलकर भारत को हरा-भरा बनाएं।",
        "mr-IN": "ग्रीनग्रिडवर आपले स्वागत आहे! मी तुमचा एआई असिस्टंट आहे, स्वच्छ, हरित ऊर्जा व्यापारासाठी।",
        "ta-IN": "கிரீன்கிரிட்டிற்கு வரவேற்கிறோம்! நான் உங்கள் AI உதவியாளர், தூய்மையான, பசுமை ஆற்றல் வர்த்தகத்திற்கு.",
        "te-IN": "గ్రీన్‌గ్రిడ్‌కు స్వాగతం! నేను మీ AI అసిస్టెంట్, శుభ్రమైన, పచ్చ శక్తి వ్యాపారం కోసం."
    },
    "contract_created": {
        "en-IN": "Great news! Your GreenGrid energy contract is now active. You are now contributing to a greener India.",
        "hi-IN": "शानदार खबर! आपका ग्रीनग्रिड ऊर्जा अनुबंध अब सक्रिय है। अब आप एक हरित भारत में योगदान दे रहे हैं।"
    },
    "payment_success": {
        "en-IN": "Payment confirmed! {amount} rupees processed successfully on GreenGrid. Thank you for choosing clean energy.",
        "hi-IN": "भुगतान सफल! ग्रीनग्रिड पर {amount} रुपये संसाधित हो गए। स्वच्छ ऊर्जा चुनने के लिए धन्यवाद।"
    },
    "price_alert": {
        "en-IN": "GreenGrid Price Alert! {energy_type} energy is now {price} rupees per unit. That's {change}% {direction} from yesterday.",
        "hi-IN": "ग्रीनग्रिड मूल्य सूचना! {energy_type} ऊर्जा अब {price} रुपये प्रति यूनिट है। यह कल से {change}% {direction} है।"
    },
    "certificate_earned": {
        "en-IN": "Congratulations! You've earned a GreenGrid Certificate. You've saved {carbon} kilograms of carbon emissions. Well done!",
        "hi-IN": "बधाई हो! आपने ग्रीनग्रिड प्रमाणपत्र अर्जित किया है। आपने {carbon} किलोग्राम कार्बन उत्सर्जन बचाया है। शाबाश!"
    },
    "daily_summary": {
        "en-IN": "Good {time_of_day}! Here's your GreenGrid energy summary: You used {consumption} kilowatt hours today. That's {comparison} yesterday.",
        "hi-IN": "शुभ {time_of_day}! आपका ग्रीनग्रिड ऊर्जा सारांश: आज आपने {consumption} किलोवाट घंटे उपयोग किया। कल की तुलना में {comparison}।"
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
        # Use configured speaker with safe fallback to Priya
        try:
            self.default_speaker = VoicePersona(settings.SARVAM_DEFAULT_SPEAKER)
        except (AttributeError, ValueError):
            self.default_speaker = VoicePersona.PRIYA
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
        
        # Response is already in our standard format from the updated client
        return TTSResponse(
            audio_base64=response["audio_base64"],
            audio_format=response.get("audio_format", "mp3"),
            duration_seconds=response.get("duration_seconds", 0.0),
            language=language.value,
            speaker=speaker.value
        )
    
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
            text = f"नमस्ते {user_name}! ग्रीनग्रिड में आपका स्वागत है। मैं आपका एआई असिस्टेंट हूं।"
        else:
            text = f"Hello {user_name}! Welcome to GreenGrid. I'm your AI assistant for clean energy trading."
        
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
        male_voices = {
            VoicePersona.ABHILASH, VoicePersona.KARUN, VoicePersona.HITESH,
            VoicePersona.ADITYA, VoicePersona.RAHUL, VoicePersona.ROHAN,
            VoicePersona.AMIT, VoicePersona.DEV, VoicePersona.RATAN,
            VoicePersona.VARUN, VoicePersona.MANAN, VoicePersona.SUMIT,
            VoicePersona.KABIR, VoicePersona.AAYAN, VoicePersona.SHUBH,
            VoicePersona.ASHUTOSH, VoicePersona.ADVAIT, VoicePersona.ANAND,
            VoicePersona.TARUN, VoicePersona.SUNNY, VoicePersona.MANI,
            VoicePersona.GOKUL, VoicePersona.VIJAY, VoicePersona.MOHIT,
            VoicePersona.REHAN, VoicePersona.SOHAM,
        }
        return [
            {"id": v.value, "name": v.value.title(), "gender": "male" if v in male_voices else "female"}
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
