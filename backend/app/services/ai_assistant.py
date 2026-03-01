"""
Verdant AI Assistant Service
============================
AI-powered chatbot for energy trading queries using Groq (primary) and Gemini (fallback).

Features:
- Energy trading Q&A
- Personalized recommendations
- Contract explanations
- Price predictions
- Sustainability tips
"""

import json
import httpx
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

from app.core.config import get_settings

settings = get_settings()


# ── Models ─────────────────────────────────────────────────────
class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str


class AssistantResponse(BaseModel):
    message: str
    tokens_used: int
    model: str
    provider: str
    suggestions: List[str] = []


# ── System Prompts ─────────────────────────────────────────────
VERDANT_SYSTEM_PROMPT = """You are Verdant AI, an intelligent assistant for the Verdant Energy Platform - 
India's premier peer-to-peer green energy trading marketplace.

Your expertise includes:
1. **Green Energy Trading**: Solar, wind, hydro, biomass energy buying/selling
2. **Smart Contracts**: Explaining energy purchase agreements and contracts
3. **Price Analysis**: Current market rates, price trends, and predictions
4. **Sustainability**: Carbon credits, RECs, environmental impact
5. **Recommendations**: Suggesting best producers based on user preferences
6. **Technical Support**: Platform usage, billing, smart meter readings

Guidelines:
- Be concise but informative (2-3 paragraphs max)
- Use ₹ (INR) for prices, kWh for energy units
- Mention specific Verdant features when relevant
- Encourage sustainable energy choices
- If unsure, suggest contacting support

Current context: User is on the Verdant Energy Platform looking to trade green energy in India."""


ANALYTICS_SYSTEM_PROMPT = """You are Verdant Analytics AI, specialized in energy data analysis.
Provide insights on:
- Consumption patterns and anomalies
- Cost optimization strategies
- Peak usage predictions
- Seasonal energy trends
- ROI calculations for green energy

Format responses with clear metrics and actionable recommendations."""


# ── Groq Client (Primary - Fast) ───────────────────────────────
class GroqClient:
    """Groq API client for fast LLM inference (Llama, Mixtral)."""
    
    BASE_URL = "https://api.groq.com/openai/v1/chat/completions"
    DEFAULT_MODEL = "llama-3.3-70b-versatile"  # Fast & capable
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> Dict[str, Any]:
        """Send chat completion request to Groq."""
        model = model or self.DEFAULT_MODEL
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.BASE_URL,
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()


# ── Gemini Client (Fallback - Advanced) ────────────────────────
class GeminiClient:
    """Google Gemini API client for advanced reasoning."""
    
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
    DEFAULT_MODEL = "gemini-1.5-flash"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> Dict[str, Any]:
        """Send chat completion request to Gemini."""
        model = model or self.DEFAULT_MODEL
        
        # Convert to Gemini format
        contents = []
        system_instruction = None
        
        for msg in messages:
            if msg["role"] == "system":
                system_instruction = msg["content"]
            else:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": msg["content"]}]
                })
        
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            }
        }
        
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }
        
        url = f"{self.BASE_URL}/{model}:generateContent?key={self.api_key}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()


# ── AI Assistant Service ───────────────────────────────────────
class AIAssistantService:
    """
    Main AI Assistant service with fallback support.
    Uses Groq (fast) as primary, Gemini as fallback.
    """
    
    def __init__(self):
        self.groq = GroqClient(settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
        self.gemini = GeminiClient(settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
        self.conversation_history: Dict[str, List[Dict]] = {}  # user_id -> messages
    
    def _get_history(self, user_id: str) -> List[Dict]:
        """Get conversation history for user."""
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []
        return self.conversation_history[user_id]
    
    def _add_to_history(self, user_id: str, role: str, content: str):
        """Add message to conversation history."""
        history = self._get_history(user_id)
        history.append({"role": role, "content": content})
        # Keep last 20 messages
        if len(history) > 20:
            self.conversation_history[user_id] = history[-20:]
    
    def clear_history(self, user_id: str):
        """Clear conversation history for user."""
        self.conversation_history[user_id] = []
    
    async def chat(
        self,
        user_id: str,
        message: str,
        context: Optional[Dict] = None,
        use_history: bool = True
    ) -> AssistantResponse:
        """
        Send a chat message and get AI response.
        
        Args:
            user_id: Unique user identifier
            message: User's message
            context: Optional context (user data, current page, etc.)
            use_history: Whether to include conversation history
        
        Returns:
            AssistantResponse with message, model info, and suggestions
        """
        # Build messages
        messages = [{"role": "system", "content": VERDANT_SYSTEM_PROMPT}]
        
        # Add context if provided
        if context:
            context_str = f"\n\nUser Context:\n{json.dumps(context, indent=2)}"
            messages[0]["content"] += context_str
        
        # Add conversation history
        if use_history:
            messages.extend(self._get_history(user_id))
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        # Try Groq first (faster)
        if self.groq:
            try:
                response = await self.groq.chat(messages)
                content = response["choices"][0]["message"]["content"]
                tokens = response.get("usage", {}).get("total_tokens", 0)
                
                # Save to history
                self._add_to_history(user_id, "user", message)
                self._add_to_history(user_id, "assistant", content)
                
                return AssistantResponse(
                    message=content,
                    tokens_used=tokens,
                    model=self.groq.DEFAULT_MODEL,
                    provider="groq",
                    suggestions=self._generate_suggestions(message, content)
                )
            except Exception as e:
                print(f"Groq error, falling back to Gemini: {e}")
        
        # Fallback to Gemini
        if self.gemini:
            try:
                response = await self.gemini.chat(messages)
                content = response["candidates"][0]["content"]["parts"][0]["text"]
                
                # Save to history
                self._add_to_history(user_id, "user", message)
                self._add_to_history(user_id, "assistant", content)
                
                return AssistantResponse(
                    message=content,
                    tokens_used=0,  # Gemini doesn't return token count in same way
                    model=self.gemini.DEFAULT_MODEL,
                    provider="gemini",
                    suggestions=self._generate_suggestions(message, content)
                )
            except Exception as e:
                print(f"Gemini error: {e}")
        
        # No AI available
        return AssistantResponse(
            message="I apologize, but I'm currently unavailable. Please try again later or contact support at support@verdant.energy",
            tokens_used=0,
            model="none",
            provider="fallback",
            suggestions=["Contact Support", "View FAQ", "Browse Marketplace"]
        )
    
    def _generate_suggestions(self, query: str, response: str) -> List[str]:
        """Generate follow-up suggestions based on conversation."""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["price", "cost", "rate"]):
            return ["Compare producer prices", "View price trends", "Set price alert"]
        elif any(word in query_lower for word in ["solar", "wind", "energy", "producer"]):
            return ["Browse solar producers", "View wind farms", "Get recommendations"]
        elif any(word in query_lower for word in ["contract", "agreement", "buy"]):
            return ["View my contracts", "Create new contract", "Contract terms explained"]
        elif any(word in query_lower for word in ["bill", "payment", "invoice"]):
            return ["View billing history", "Download invoice", "Payment methods"]
        elif any(word in query_lower for word in ["certificate", "rec", "carbon"]):
            return ["My certificates", "How RECs work", "Carbon offset calculator"]
        else:
            return ["Browse marketplace", "View recommendations", "Check my dashboard"]
    
    async def quick_query(
        self,
        query: str,
        system_prompt: str = VERDANT_SYSTEM_PROMPT
    ) -> str:
        """Quick one-off query without history tracking."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ]
        
        if self.groq:
            try:
                response = await self.groq.chat(messages, max_tokens=512)
                return response["choices"][0]["message"]["content"]
            except:
                pass
        
        if self.gemini:
            try:
                response = await self.gemini.chat(messages, max_tokens=512)
                return response["candidates"][0]["content"]["parts"][0]["text"]
            except:
                pass
        
        return "Unable to process query at this time."
    
    async def get_energy_tip(self) -> str:
        """Get a random energy saving tip."""
        prompt = """Generate a single, practical energy saving tip for Indian households.
        Make it specific, actionable, and mention potential savings in ₹ or kWh.
        Keep it under 50 words."""
        return await self.quick_query(prompt)
    
    async def explain_concept(self, concept: str) -> str:
        """Explain an energy/trading concept in simple terms."""
        prompt = f"""Explain '{concept}' in the context of green energy trading in India.
        Use simple language, give an example, and keep it under 100 words."""
        return await self.quick_query(prompt)
    
    async def analyze_usage(self, usage_data: Dict) -> str:
        """Analyze user's energy usage and provide insights."""
        prompt = f"""Analyze this energy usage data and provide 3 key insights with recommendations:
        {json.dumps(usage_data, indent=2)}
        
        Focus on:
        1. Consumption patterns
        2. Cost optimization
        3. Green energy opportunities
        
        Keep response under 150 words."""
        return await self.quick_query(prompt, ANALYTICS_SYSTEM_PROMPT)


# ── Singleton Instance ─────────────────────────────────────────
_assistant: Optional[AIAssistantService] = None


def get_ai_assistant() -> AIAssistantService:
    """Get or create AI Assistant singleton."""
    global _assistant
    if _assistant is None:
        _assistant = AIAssistantService()
    return _assistant


# ── Quick Access Functions ─────────────────────────────────────
async def chat_with_assistant(
    user_id: str,
    message: str,
    context: Optional[Dict] = None
) -> AssistantResponse:
    """Quick access to chat function."""
    assistant = get_ai_assistant()
    return await assistant.chat(user_id, message, context)


async def get_energy_tip() -> str:
    """Get a quick energy tip."""
    assistant = get_ai_assistant()
    return await assistant.get_energy_tip()


async def explain_energy_concept(concept: str) -> str:
    """Explain an energy concept."""
    assistant = get_ai_assistant()
    return await assistant.explain_concept(concept)
