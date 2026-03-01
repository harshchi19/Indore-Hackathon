/* ── AI Service Types ────────────────────────────────────────── */

// ── Enums ─────────────────────────────────────────────────────

export type TrendDirection = "up" | "down" | "stable";
export type PredictionConfidence = "high" | "medium" | "low";

// ── Assistant ─────────────────────────────────────────────────

export interface AssistantResponse {
  message: string;
  tokens_used: number;
  model: string;
  provider: string;
  suggestions: string[];
}

export interface ChatRequest {
  message: string;
  user_id?: string;
  context?: Record<string, unknown>;
  use_history?: boolean;
}

export interface ExplainRequest {
  concept: string;
}

export interface ExplainResponse {
  concept: string;
  explanation: string;
}

export interface TipResponse {
  tip: string;
}

export interface ClearHistoryResponse {
  status: string;
  user_id: string;
}

// ── Chat UI helpers ────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  tokens_used?: number;
  model?: string;
  provider?: string;
}

// ── Analytics ─────────────────────────────────────────────────

export interface EnergyInsight {
  title: string;
  description: string;
  impact: "savings" | "efficiency" | "sustainability";
  priority: number;
  action?: string;
}

export interface ConsumptionAnalysis {
  total_kwh: number;
  average_daily_kwh: number;
  peak_hour: number;
  peak_day: string;
  trend: TrendDirection;
  anomalies: string[];
  insights: EnergyInsight[];
  recommendations: string[];
}

export interface ConsumptionRequest {
  readings: Array<{ timestamp: string; kwh: number; source?: string }>;
  user_profile?: Record<string, unknown>;
}

export interface PricePrediction {
  current_price: number;
  predicted_price: number;
  change_percent: number;
  trend: TrendDirection;
  confidence: PredictionConfidence;
  reasoning: string;
  best_time_to_buy?: string | null;
}

export interface PriceRequest {
  energy_type?: string;
  current_price?: number;
  historical_prices?: number[];
}

export interface SustainabilityScore {
  overall_score: number;
  green_percentage: number;
  carbon_saved_kg: number;
  tree_equivalent: number;
  ranking: string;
  improvement_tips: string[];
}

export interface SustainabilityRequest {
  total_consumption_kwh: number;
  green_energy_kwh: number;
  certificates_owned?: number;
}

export interface ProducerRecommendation {
  producer_id: string;
  match_score: number;
  reasons: string[];
  potential_savings: string;
}

export interface RecommendationRequest {
  user_preferences: Record<string, unknown>;
  available_producers: Array<Record<string, unknown>>;
  limit?: number;
}

export interface RecommendationResponse {
  recommendations: ProducerRecommendation[];
}

// ── Voice ─────────────────────────────────────────────────────

export interface TTSResponse {
  audio_base64: string;
  audio_format: string;
  duration_seconds: number;
  language: string;
  speaker: string;
}

export interface TTSRequest {
  text: string;
  language?: string;
  speaker?: string;
}

export interface NotificationRequest {
  notification_type: string;
  language?: string;
  params?: Record<string, unknown>;
}

export interface VoiceLanguage {
  code: string;
  name: string;
}

export interface VoiceSpeaker {
  name: string;
  gender: string;
}

export interface LanguagesResponse {
  languages: Array<{ code: string; name: string }>;
}

export interface SpeakersResponse {
  speakers: Array<{ name: string; gender: string }>;
}

// ── Health / Models ───────────────────────────────────────────

export interface AIHealthStatus {
  status: string;
  services: {
    assistant: { groq: boolean; gemini: boolean };
    analytics: { gemini: boolean };
    voice: { sarvam: boolean };
  };
}

export interface AIModelsInfo {
  assistant: { primary: string; fallback: string };
  analytics: { model: string };
  voice: { model: string; languages: number; voices: number };
}
