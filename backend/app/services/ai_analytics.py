"""
Verdant AI Analytics Service
=============================
AI-powered energy analytics, predictions, and insights using Gemini.

Features:
- Consumption pattern analysis
- Price prediction and forecasting
- Anomaly detection
- ROI calculations
- Sustainability scoring
- Smart recommendations
"""

import json
import httpx
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
from pydantic import BaseModel
from enum import Enum
import statistics

from app.core.config import get_settings

settings = get_settings()


# ── Models ─────────────────────────────────────────────────────
class TrendDirection(str, Enum):
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class PredictionConfidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class EnergyInsight(BaseModel):
    title: str
    description: str
    impact: str  # "savings", "efficiency", "sustainability"
    priority: int  # 1-5, 5 being highest
    action: Optional[str] = None


class PricePrediction(BaseModel):
    current_price: float
    predicted_price: float
    change_percent: float
    trend: TrendDirection
    confidence: PredictionConfidence
    reasoning: str
    best_time_to_buy: Optional[str] = None


class ConsumptionAnalysis(BaseModel):
    total_kwh: float
    average_daily_kwh: float
    peak_hour: int
    peak_day: str
    trend: TrendDirection
    anomalies: List[str]
    insights: List[EnergyInsight]
    recommendations: List[str]


class SustainabilityScore(BaseModel):
    overall_score: int  # 0-100
    green_percentage: float
    carbon_saved_kg: float
    tree_equivalent: int
    ranking: str  # "Eco Champion", "Green Leader", etc.
    improvement_tips: List[str]


# ── System Prompts ─────────────────────────────────────────────
ANALYTICS_PROMPT = """You are Verdant Analytics AI, an expert in energy data analysis for India's green energy market.

Your analysis should:
1. Be data-driven with specific numbers
2. Consider Indian energy market context (peak hours 6-10 PM, monsoon variations, etc.)
3. Provide actionable recommendations
4. Use ₹ (INR) for costs and kWh for energy
5. Consider regional variations (state tariffs, solar potential, etc.)

Always structure your response as valid JSON when asked for structured output."""


PREDICTION_PROMPT = """You are Verdant Price Predictor AI. Analyze energy market trends and predict prices.

Consider factors:
1. Time of day and season
2. Renewable energy availability (solar peaks at noon, wind varies)
3. Grid demand patterns in India
4. Government policies and subsidies
5. Monsoon impact on hydro generation

Provide predictions with confidence levels and reasoning."""


# ── Gemini Analytics Client ────────────────────────────────────
class GeminiAnalytics:
    """Gemini-powered analytics engine."""
    
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
    MODEL = "gemini-1.5-flash"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def analyze(
        self,
        prompt: str,
        system_prompt: str = ANALYTICS_PROMPT,
        json_output: bool = False
    ) -> str:
        """Send analysis request to Gemini."""
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": prompt}]}
            ],
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "generationConfig": {
                "temperature": 0.3,  # Lower for more consistent analysis
                "maxOutputTokens": 2048,
            }
        }
        
        if json_output:
            payload["generationConfig"]["responseMimeType"] = "application/json"
        
        url = f"{self.BASE_URL}/{self.MODEL}:generateContent?key={self.api_key}"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]


# ── AI Analytics Service ───────────────────────────────────────
class AIAnalyticsService:
    """
    AI-powered analytics for energy consumption, pricing, and sustainability.
    """
    
    def __init__(self):
        self.gemini = GeminiAnalytics(settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
    
    # ── Consumption Analysis ───────────────────────────────────
    async def analyze_consumption(
        self,
        readings: List[Dict],
        user_profile: Optional[Dict] = None
    ) -> ConsumptionAnalysis:
        """
        Analyze energy consumption patterns.
        
        Args:
            readings: List of {timestamp, kwh, source} readings
            user_profile: Optional user data for personalized insights
        """
        if not readings:
            return self._empty_consumption_analysis()
        
        # Calculate basic statistics
        kwh_values = [r.get("kwh", 0) for r in readings]
        total_kwh = sum(kwh_values)
        avg_daily = total_kwh / max(len(readings), 1)
        
        # Find peak patterns
        hourly_consumption = {}
        daily_consumption = {}
        
        for r in readings:
            ts = r.get("timestamp", "")
            kwh = r.get("kwh", 0)
            
            if ts:
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    hour = dt.hour
                    day = dt.strftime("%A")
                    
                    hourly_consumption[hour] = hourly_consumption.get(hour, 0) + kwh
                    daily_consumption[day] = daily_consumption.get(day, 0) + kwh
                except:
                    pass
        
        peak_hour = max(hourly_consumption, key=hourly_consumption.get) if hourly_consumption else 18
        peak_day = max(daily_consumption, key=daily_consumption.get) if daily_consumption else "Unknown"
        
        # Determine trend
        if len(kwh_values) >= 2:
            first_half = statistics.mean(kwh_values[:len(kwh_values)//2])
            second_half = statistics.mean(kwh_values[len(kwh_values)//2:])
            if second_half > first_half * 1.1:
                trend = TrendDirection.UP
            elif second_half < first_half * 0.9:
                trend = TrendDirection.DOWN
            else:
                trend = TrendDirection.STABLE
        else:
            trend = TrendDirection.STABLE
        
        # Detect anomalies
        anomalies = []
        if kwh_values:
            mean_kwh = statistics.mean(kwh_values)
            std_kwh = statistics.stdev(kwh_values) if len(kwh_values) > 1 else 0
            for i, kwh in enumerate(kwh_values):
                if std_kwh > 0 and abs(kwh - mean_kwh) > 2 * std_kwh:
                    anomalies.append(f"Unusual consumption detected at reading {i+1}: {kwh:.2f} kWh")
        
        # Get AI insights if available
        insights = []
        recommendations = []
        
        if self.gemini:
            try:
                ai_response = await self._get_ai_consumption_insights(
                    total_kwh, avg_daily, peak_hour, peak_day, trend, user_profile
                )
                insights = ai_response.get("insights", [])
                recommendations = ai_response.get("recommendations", [])
            except Exception as e:
                print(f"AI insights error: {e}")
        
        # Fallback insights if AI unavailable
        if not insights:
            insights = [
                EnergyInsight(
                    title="Peak Usage Detected",
                    description=f"Your peak consumption is at {peak_hour}:00 hours",
                    impact="efficiency",
                    priority=4,
                    action="Consider shifting non-essential usage to off-peak hours"
                )
            ]
        
        if not recommendations:
            recommendations = [
                f"Shift high-power appliances away from {peak_hour}:00 peak hours",
                "Consider solar energy to offset daytime consumption",
                "Install smart meters for real-time monitoring"
            ]
        
        return ConsumptionAnalysis(
            total_kwh=total_kwh,
            average_daily_kwh=avg_daily,
            peak_hour=peak_hour,
            peak_day=peak_day,
            trend=trend,
            anomalies=anomalies[:5],  # Limit to 5
            insights=insights[:5],
            recommendations=recommendations[:5]
        )
    
    async def _get_ai_consumption_insights(
        self,
        total_kwh: float,
        avg_daily: float,
        peak_hour: int,
        peak_day: str,
        trend: TrendDirection,
        user_profile: Optional[Dict]
    ) -> Dict:
        """Get AI-powered insights for consumption."""
        prompt = f"""Analyze this energy consumption data and provide insights:

Total Consumption: {total_kwh:.2f} kWh
Average Daily: {avg_daily:.2f} kWh
Peak Hour: {peak_hour}:00
Peak Day: {peak_day}
Trend: {trend.value}
User Profile: {json.dumps(user_profile) if user_profile else "Not provided"}

Return JSON with:
{{
    "insights": [
        {{"title": "string", "description": "string", "impact": "savings|efficiency|sustainability", "priority": 1-5, "action": "string"}}
    ],
    "recommendations": ["string", "string", "string"]
}}

Provide 3-5 insights and recommendations relevant to Indian households."""
        
        response = await self.gemini.analyze(prompt, json_output=True)
        return json.loads(response)
    
    def _empty_consumption_analysis(self) -> ConsumptionAnalysis:
        """Return empty analysis when no data."""
        return ConsumptionAnalysis(
            total_kwh=0,
            average_daily_kwh=0,
            peak_hour=0,
            peak_day="Unknown",
            trend=TrendDirection.STABLE,
            anomalies=[],
            insights=[],
            recommendations=["Start tracking your energy consumption to get insights"]
        )
    
    # ── Price Prediction ───────────────────────────────────────
    async def predict_price(
        self,
        energy_type: str,
        current_price: float,
        historical_prices: Optional[List[float]] = None
    ) -> PricePrediction:
        """
        Predict future energy prices.
        
        Args:
            energy_type: Type of energy (solar, wind, hydro, etc.)
            current_price: Current price per kWh in INR
            historical_prices: Optional list of historical prices
        """
        if not self.gemini:
            return self._simple_price_prediction(energy_type, current_price, historical_prices)
        
        try:
            prompt = f"""Predict the price trend for {energy_type} energy in India.

Current Price: ₹{current_price}/kWh
Historical Prices (last 10): {historical_prices if historical_prices else "Not available"}
Current Month: {datetime.now().strftime("%B")}
Current Hour: {datetime.now().hour}:00

Consider:
- Seasonal factors (monsoon for hydro, summer for solar)
- Time of day (solar availability)
- Grid demand patterns
- Government policies

Return JSON:
{{
    "predicted_price": float,
    "change_percent": float,
    "trend": "up|down|stable",
    "confidence": "high|medium|low",
    "reasoning": "string (50 words max)",
    "best_time_to_buy": "string or null"
}}"""
            
            response = await self.gemini.analyze(prompt, PREDICTION_PROMPT, json_output=True)
            data = json.loads(response)
            
            return PricePrediction(
                current_price=current_price,
                predicted_price=data["predicted_price"],
                change_percent=data["change_percent"],
                trend=TrendDirection(data["trend"]),
                confidence=PredictionConfidence(data["confidence"]),
                reasoning=data["reasoning"],
                best_time_to_buy=data.get("best_time_to_buy")
            )
        except Exception as e:
            print(f"Price prediction error: {e}")
            return self._simple_price_prediction(energy_type, current_price, historical_prices)
    
    def _simple_price_prediction(
        self,
        energy_type: str,
        current_price: float,
        historical_prices: Optional[List[float]]
    ) -> PricePrediction:
        """Simple rule-based price prediction fallback."""
        hour = datetime.now().hour
        
        # Solar cheaper during day, wind varies
        if energy_type == "solar":
            if 10 <= hour <= 16:
                predicted = current_price * 0.95
                trend = TrendDirection.DOWN
                reasoning = "Solar generation peaks during midday, prices typically lower"
            else:
                predicted = current_price * 1.05
                trend = TrendDirection.UP
                reasoning = "Solar generation reduces after sunset"
        elif energy_type == "wind":
            predicted = current_price * 0.98
            trend = TrendDirection.STABLE
            reasoning = "Wind energy prices relatively stable"
        else:
            predicted = current_price
            trend = TrendDirection.STABLE
            reasoning = "Baseline energy prices"
        
        return PricePrediction(
            current_price=current_price,
            predicted_price=round(predicted, 2),
            change_percent=round((predicted - current_price) / current_price * 100, 2),
            trend=trend,
            confidence=PredictionConfidence.MEDIUM,
            reasoning=reasoning,
            best_time_to_buy="10:00 AM - 4:00 PM" if energy_type == "solar" else None
        )
    
    # ── Sustainability Scoring ─────────────────────────────────
    async def calculate_sustainability_score(
        self,
        total_consumption_kwh: float,
        green_energy_kwh: float,
        certificates_owned: int = 0
    ) -> SustainabilityScore:
        """
        Calculate user's sustainability score.
        
        Args:
            total_consumption_kwh: Total energy consumed
            green_energy_kwh: Energy from green sources
            certificates_owned: Number of green certificates
        """
        # Calculate percentages
        green_percentage = (green_energy_kwh / total_consumption_kwh * 100) if total_consumption_kwh > 0 else 0
        
        # Carbon calculations (avg 0.82 kg CO2 per kWh in India)
        carbon_saved_kg = green_energy_kwh * 0.82
        tree_equivalent = int(carbon_saved_kg / 21)  # ~21 kg CO2 per tree per year
        
        # Calculate score (0-100)
        base_score = min(green_percentage, 80)  # Max 80 from green %
        cert_bonus = min(certificates_owned * 2, 15)  # Max 15 from certs
        tree_bonus = min(tree_equivalent, 5)  # Max 5 from trees
        overall_score = int(base_score + cert_bonus + tree_bonus)
        
        # Determine ranking
        if overall_score >= 90:
            ranking = "🌟 Eco Champion"
        elif overall_score >= 75:
            ranking = "🌿 Green Leader"
        elif overall_score >= 50:
            ranking = "🌱 Sustainability Advocate"
        elif overall_score >= 25:
            ranking = "🌾 Green Beginner"
        else:
            ranking = "🌰 Just Starting"
        
        # Get AI improvement tips
        tips = []
        if self.gemini:
            try:
                tips = await self._get_sustainability_tips(
                    overall_score, green_percentage, carbon_saved_kg
                )
            except:
                pass
        
        if not tips:
            tips = [
                "Switch to 100% green energy sources",
                "Install rooftop solar panels",
                "Purchase Renewable Energy Certificates (RECs)",
                "Monitor and reduce peak hour consumption"
            ]
        
        return SustainabilityScore(
            overall_score=overall_score,
            green_percentage=round(green_percentage, 1),
            carbon_saved_kg=round(carbon_saved_kg, 2),
            tree_equivalent=tree_equivalent,
            ranking=ranking,
            improvement_tips=tips[:4]
        )
    
    async def _get_sustainability_tips(
        self,
        score: int,
        green_pct: float,
        carbon_saved: float
    ) -> List[str]:
        """Get AI-powered sustainability tips."""
        prompt = f"""User's sustainability profile:
- Score: {score}/100
- Green Energy: {green_pct}%
- Carbon Saved: {carbon_saved} kg

Provide 4 specific, actionable tips to improve their sustainability score.
Focus on Indian context (solar potential, government schemes like PM Surya Ghar, etc.)

Return JSON array: ["tip1", "tip2", "tip3", "tip4"]"""
        
        response = await self.gemini.analyze(prompt, json_output=True)
        return json.loads(response)
    
    # ── Producer Matching ──────────────────────────────────────
    async def get_smart_recommendations(
        self,
        user_preferences: Dict,
        available_producers: List[Dict],
        limit: int = 5
    ) -> List[Dict]:
        """
        Get AI-powered producer recommendations.
        
        Args:
            user_preferences: User's energy preferences and constraints
            available_producers: List of available producers
            limit: Max recommendations to return
        """
        if not self.gemini or not available_producers:
            # Fallback to simple matching
            return self._simple_match(user_preferences, available_producers, limit)
        
        try:
            prompt = f"""Match this user with the best energy producers:

User Preferences:
{json.dumps(user_preferences, indent=2)}

Available Producers (sample):
{json.dumps(available_producers[:20], indent=2)}

Return JSON array of top {limit} matches:
[
    {{
        "producer_id": "string",
        "match_score": 0-100,
        "reasons": ["reason1", "reason2"],
        "potential_savings": "₹X/month"
    }}
]

Consider: energy type preference, budget, location, reliability, sustainability."""
            
            response = await self.gemini.analyze(prompt, json_output=True)
            return json.loads(response)[:limit]
        except Exception as e:
            print(f"Smart recommendations error: {e}")
            return self._simple_match(user_preferences, available_producers, limit)
    
    def _simple_match(
        self,
        preferences: Dict,
        producers: List[Dict],
        limit: int
    ) -> List[Dict]:
        """Simple producer matching fallback."""
        preferred_type = preferences.get("energy_type", "solar")
        max_price = preferences.get("max_price_per_kwh", 10)
        
        matches = []
        for p in producers:
            score = 50  # Base score
            reasons = []
            
            if p.get("energy_type") == preferred_type:
                score += 30
                reasons.append(f"Matches {preferred_type} preference")
            
            if p.get("price_per_kwh", 100) <= max_price:
                score += 20
                reasons.append("Within budget")
            
            matches.append({
                "producer_id": p.get("id"),
                "match_score": score,
                "reasons": reasons,
                "potential_savings": f"₹{int((max_price - p.get('price_per_kwh', 0)) * 500)}/month"
            })
        
        return sorted(matches, key=lambda x: x["match_score"], reverse=True)[:limit]


# ── Singleton Instance ─────────────────────────────────────────
_analytics: Optional[AIAnalyticsService] = None


def get_ai_analytics() -> AIAnalyticsService:
    """Get or create AI Analytics singleton."""
    global _analytics
    if _analytics is None:
        _analytics = AIAnalyticsService()
    return _analytics


# ── Quick Access Functions ─────────────────────────────────────
async def analyze_user_consumption(readings: List[Dict]) -> ConsumptionAnalysis:
    """Quick access to consumption analysis."""
    analytics = get_ai_analytics()
    return await analytics.analyze_consumption(readings)


async def predict_energy_price(energy_type: str, current_price: float) -> PricePrediction:
    """Quick access to price prediction."""
    analytics = get_ai_analytics()
    return await analytics.predict_price(energy_type, current_price)


async def get_sustainability_score(
    total_kwh: float,
    green_kwh: float,
    certs: int = 0
) -> SustainabilityScore:
    """Quick access to sustainability scoring."""
    analytics = get_ai_analytics()
    return await analytics.calculate_sustainability_score(total_kwh, green_kwh, certs)
