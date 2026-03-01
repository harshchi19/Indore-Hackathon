import apiClient from "./apiClient";
import type {
  AIHealthStatus,
  AIModelsInfo,
  AssistantResponse,
  ChatRequest,
  ClearHistoryResponse,
  ConsumptionAnalysis,
  ConsumptionRequest,
  ExplainRequest,
  ExplainResponse,
  LanguagesResponse,
  NotificationRequest,
  PricePrediction,
  PriceRequest,
  RecommendationRequest,
  RecommendationResponse,
  SpeakersResponse,
  SustainabilityRequest,
  SustainabilityScore,
  TipResponse,
  TTSRequest,
  TTSResponse,
} from "@/types/ai";

export const aiService = {
  /* ── Health & Info ────────────────────────────────── */

  async getHealth(): Promise<AIHealthStatus> {
    const { data } = await apiClient.get<AIHealthStatus>("/ai/health");
    return data;
  },

  async getModels(): Promise<AIModelsInfo> {
    const { data } = await apiClient.get<AIModelsInfo>("/ai/models");
    return data;
  },

  /* ── Assistant ────────────────────────────────────── */

  async chat(request: ChatRequest): Promise<AssistantResponse> {
    const { data } = await apiClient.post<AssistantResponse>(
      "/ai/chat",
      request,
    );
    return data;
  },

  async clearHistory(userId: string): Promise<ClearHistoryResponse> {
    const { data } = await apiClient.post<ClearHistoryResponse>(
      "/ai/chat/clear",
      null,
      { params: { user_id: userId } },
    );
    return data;
  },

  async getTip(): Promise<TipResponse> {
    const { data } = await apiClient.get<TipResponse>("/ai/tip");
    return data;
  },

  async explain(request: ExplainRequest): Promise<ExplainResponse> {
    const { data } = await apiClient.post<ExplainResponse>(
      "/ai/explain",
      request,
    );
    return data;
  },

  /* ── Analytics ────────────────────────────────────── */

  async analyzeConsumption(
    request: ConsumptionRequest,
  ): Promise<ConsumptionAnalysis> {
    const { data } = await apiClient.post<ConsumptionAnalysis>(
      "/ai/analytics/consumption",
      request,
    );
    return data;
  },

  async predictPrice(request: PriceRequest): Promise<PricePrediction> {
    const { data } = await apiClient.post<PricePrediction>(
      "/ai/analytics/predict-price",
      request,
    );
    return data;
  },

  async getSustainabilityScore(
    request: SustainabilityRequest,
  ): Promise<SustainabilityScore> {
    const { data } = await apiClient.post<SustainabilityScore>(
      "/ai/analytics/sustainability",
      request,
    );
    return data;
  },

  async getRecommendations(
    request: RecommendationRequest,
  ): Promise<RecommendationResponse> {
    const { data } = await apiClient.post<RecommendationResponse>(
      "/ai/analytics/recommendations",
      request,
    );
    return data;
  },

  /* ── Voice ────────────────────────────────────────── */

  async speak(request: TTSRequest): Promise<TTSResponse> {
    const { data } = await apiClient.post<TTSResponse>(
      "/ai/voice/speak",
      request,
    );
    return data;
  },

  async speakNotification(
    request: NotificationRequest,
  ): Promise<TTSResponse> {
    const { data } = await apiClient.post<TTSResponse>(
      "/ai/voice/notification",
      request,
    );
    return data;
  },

  async getLanguages(): Promise<LanguagesResponse> {
    const { data } = await apiClient.get<LanguagesResponse>(
      "/ai/voice/languages",
    );
    return data;
  },

  async getSpeakers(): Promise<SpeakersResponse> {
    const { data } = await apiClient.get<SpeakersResponse>(
      "/ai/voice/speakers",
    );
    return data;
  },
};
