"""
Verdant AI Routes
==================
API endpoints for AI services: Assistant, Analytics, and Voice.
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from enum import Enum

from app.services.ai_assistant import (
    get_ai_assistant,
    AssistantResponse,
    chat_with_assistant,
    get_energy_tip,
    explain_energy_concept
)
from app.services.ai_analytics import (
    get_ai_analytics,
    ConsumptionAnalysis,
    PricePrediction,
    SustainabilityScore,
    analyze_user_consumption,
    predict_energy_price,
    get_sustainability_score
)
from app.services.ai_voice import (
    get_ai_voice,
    TTSResponse,
    IndianLanguage,
    VoicePersona,
    text_to_speech
)

router = APIRouter(prefix="/ai", tags=["AI Services"])


# ── Request/Response Models ────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    user_id: str = "anonymous"
    context: Optional[Dict[str, Any]] = None
    use_history: bool = True


class ExplainRequest(BaseModel):
    concept: str


class ConsumptionRequest(BaseModel):
    readings: List[Dict[str, Any]]
    user_profile: Optional[Dict[str, Any]] = None


class PriceRequest(BaseModel):
    energy_type: str = "solar"
    current_price: float = 5.0
    historical_prices: Optional[List[float]] = None


class SustainabilityRequest(BaseModel):
    total_consumption_kwh: float
    green_energy_kwh: float
    certificates_owned: int = 0


class TTSRequest(BaseModel):
    text: str
    language: str = "hi-IN"
    speaker: str = "priya"


class NotificationRequest(BaseModel):
    notification_type: str
    language: str = "hi-IN"
    params: Optional[Dict[str, Any]] = None


class RecommendationRequest(BaseModel):
    user_preferences: Dict[str, Any]
    available_producers: List[Dict[str, Any]]
    limit: int = 5


# ── Health Check ───────────────────────────────────────────────
@router.get("/health")
async def ai_health_check():
    """Check AI services health status."""
    assistant = get_ai_assistant()
    analytics = get_ai_analytics()
    voice = get_ai_voice()
    
    return {
        "status": "healthy",
        "services": {
            "assistant": {
                "groq": assistant.groq is not None,
                "gemini": assistant.gemini is not None
            },
            "analytics": {
                "gemini": analytics.gemini is not None
            },
            "voice": {
                "sarvam": voice.is_available
            }
        }
    }


# ── Assistant Endpoints ────────────────────────────────────────
@router.post("/chat", response_model=AssistantResponse)
async def chat(request: ChatRequest):
    """
    Chat with Verdant AI Assistant.
    
    - Uses Groq (fast) as primary, Gemini as fallback
    - Maintains conversation history per user
    - Provides energy-focused responses
    """
    try:
        return await chat_with_assistant(
            user_id=request.user_id,
            message=request.message,
            context=request.context
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.post("/chat/clear")
async def clear_chat_history(user_id: str = Query(...)):
    """Clear conversation history for a user."""
    assistant = get_ai_assistant()
    assistant.clear_history(user_id)
    return {"status": "cleared", "user_id": user_id}


@router.get("/tip")
async def get_tip():
    """Get a random energy saving tip."""
    try:
        tip = await get_energy_tip()
        return {"tip": tip}
    except Exception as e:
        return {"tip": "Switch off lights and fans when not in use. This can save up to ₹500/month."}


@router.post("/explain")
async def explain(request: ExplainRequest):
    """Explain an energy/trading concept."""
    try:
        explanation = await explain_energy_concept(request.concept)
        return {"concept": request.concept, "explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explain error: {str(e)}")


# ── Analytics Endpoints ────────────────────────────────────────
@router.post("/analytics/consumption", response_model=ConsumptionAnalysis)
async def analyze_consumption(request: ConsumptionRequest):
    """
    Analyze energy consumption patterns.
    
    Provides:
    - Usage statistics
    - Peak hour/day detection
    - Anomaly detection
    - AI-powered insights and recommendations
    """
    try:
        analytics = get_ai_analytics()
        return await analytics.analyze_consumption(
            readings=request.readings,
            user_profile=request.user_profile
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@router.post("/analytics/predict-price", response_model=PricePrediction)
async def predict_price(request: PriceRequest):
    """
    Predict energy prices.
    
    Returns:
    - Predicted price
    - Trend direction
    - Confidence level
    - Best time to buy
    """
    try:
        return await predict_energy_price(
            energy_type=request.energy_type,
            current_price=request.current_price
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.post("/analytics/sustainability", response_model=SustainabilityScore)
async def sustainability_score(request: SustainabilityRequest):
    """
    Calculate sustainability score.
    
    Returns:
    - Overall score (0-100)
    - Green energy percentage
    - Carbon saved
    - Ranking badge
    - Improvement tips
    """
    try:
        return await get_sustainability_score(
            total_kwh=request.total_consumption_kwh,
            green_kwh=request.green_energy_kwh,
            certs=request.certificates_owned
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")


@router.post("/analytics/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """
    Get AI-powered producer recommendations.
    
    Matches users with best producers based on:
    - Energy preferences
    - Budget constraints
    - Location
    - Reliability scores
    """
    try:
        analytics = get_ai_analytics()
        recommendations = await analytics.get_smart_recommendations(
            user_preferences=request.user_preferences,
            available_producers=request.available_producers,
            limit=request.limit
        )
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


# ── Voice Endpoints ────────────────────────────────────────────
@router.post("/voice/speak", response_model=TTSResponse)
async def speak(request: TTSRequest):
    """
    Convert text to speech in Indian languages.
    
    Supported languages: Hindi, English, Bengali, Gujarati, Kannada, 
    Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu
    
    Returns base64-encoded audio (WAV format).
    """
    voice = get_ai_voice()
    
    if not voice.is_available:
        raise HTTPException(
            status_code=503,
            detail="Voice service unavailable. Sarvam API key not configured."
        )
    
    try:
        language = IndianLanguage(request.language)
        # Accept speaker as lowercase, with fallback to meera
        try:
            speaker = VoicePersona(request.speaker.lower())
        except ValueError:
            speaker = VoicePersona.PRIYA
        
        return await voice.speak(
            text=request.text,
            language=language,
            speaker=speaker
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid language or speaker: {str(e)}")
    except RuntimeError as e:
        # Sarvam API errors (bad key, rate limit, unexpected response)
        raise HTTPException(status_code=503, detail=f"Voice service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected voice error: {str(e)}")


@router.post("/voice/notification")
async def speak_notification(request: NotificationRequest):
    """
    Speak a pre-defined notification in Indian languages.
    
    Notification types:
    - welcome, contract_created, payment_success
    - price_alert, certificate_earned, daily_summary
    """
    voice = get_ai_voice()
    
    if not voice.is_available:
        raise HTTPException(
            status_code=503,
            detail="Voice service unavailable"
        )
    
    try:
        language = IndianLanguage(request.language)
        return await voice.speak_notification(
            notification_type=request.notification_type,
            language=language,
            params=request.params
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notification error: {str(e)}")


@router.get("/voice/languages")
async def get_languages():
    """Get list of supported languages."""
    voice = get_ai_voice()
    return {"languages": voice.get_supported_languages()}


@router.get("/voice/speakers")
async def get_speakers():
    """Get list of available voice personas."""
    voice = get_ai_voice()
    return {"speakers": voice.get_available_voices()}


# ── Utility Endpoints ──────────────────────────────────────────
@router.get("/models")
async def get_available_models():
    """Get information about available AI models."""
    return {
        "assistant": {
            "primary": "Groq (Llama 3.3 70B)",
            "fallback": "Google Gemini 1.5 Flash"
        },
        "analytics": {
            "model": "Google Gemini 1.5 Flash"
        },
        "voice": {
            "model": "Sarvam Bulbul v3",
            "languages": 11,
            "voices": 10
        }
    }
