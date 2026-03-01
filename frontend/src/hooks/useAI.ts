import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiService } from "@/services/aiService";
import type {
  AIHealthStatus,
  AIModelsInfo,
  AssistantResponse,
  ChatRequest,
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

/* ── Query keys ──────────────────────────────────────── */

export const aiKeys = {
  all: ["ai"] as const,
  health: () => [...aiKeys.all, "health"] as const,
  models: () => [...aiKeys.all, "models"] as const,
  tip: () => [...aiKeys.all, "tip"] as const,
  languages: () => [...aiKeys.all, "languages"] as const,
  speakers: () => [...aiKeys.all, "speakers"] as const,
};

/* ── Health & Info ───────────────────────────────────── */

export function useAIHealth() {
  return useQuery<AIHealthStatus, Error>({
    queryKey: aiKeys.health(),
    queryFn: () => aiService.getHealth(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useAIModels() {
  return useQuery<AIModelsInfo, Error>({
    queryKey: aiKeys.models(),
    queryFn: () => aiService.getModels(),
    staleTime: 300_000,
  });
}

/* ── Assistant ───────────────────────────────────────── */

export function useAIChat() {
  return useMutation<AssistantResponse, Error, ChatRequest>({
    mutationFn: (request) => aiService.chat(request),
  });
}

export function useAIClearHistory() {
  return useMutation<{ status: string; user_id: string }, Error, string>({
    mutationFn: (userId) => aiService.clearHistory(userId),
  });
}

export function useAITip() {
  return useQuery<TipResponse, Error>({
    queryKey: aiKeys.tip(),
    queryFn: () => aiService.getTip(),
    staleTime: 120_000,
  });
}

export function useAIExplain() {
  return useMutation<ExplainResponse, Error, ExplainRequest>({
    mutationFn: (request) => aiService.explain(request),
  });
}

/* ── Analytics ───────────────────────────────────────── */

export function useConsumptionAnalysis() {
  return useMutation<ConsumptionAnalysis, Error, ConsumptionRequest>({
    mutationFn: (request) => aiService.analyzeConsumption(request),
  });
}

export function usePricePrediction() {
  return useMutation<PricePrediction, Error, PriceRequest>({
    mutationFn: (request) => aiService.predictPrice(request),
  });
}

export function useSustainabilityScore() {
  return useMutation<SustainabilityScore, Error, SustainabilityRequest>({
    mutationFn: (request) => aiService.getSustainabilityScore(request),
  });
}

export function useAIRecommendations() {
  const queryClient = useQueryClient();
  return useMutation<RecommendationResponse, Error, RecommendationRequest>({
    mutationFn: (request) => aiService.getRecommendations(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.all });
    },
  });
}

/* ── Voice ───────────────────────────────────────────── */

export function useVoiceSpeak() {
  return useMutation<TTSResponse, Error, TTSRequest>({
    mutationFn: (request) => aiService.speak(request),
  });
}

export function useVoiceNotification() {
  return useMutation<TTSResponse, Error, NotificationRequest>({
    mutationFn: (request) => aiService.speakNotification(request),
  });
}

export function useVoiceLanguages() {
  return useQuery<LanguagesResponse, Error>({
    queryKey: aiKeys.languages(),
    queryFn: () => aiService.getLanguages(),
    staleTime: 600_000,
  });
}

export function useVoiceSpeakers() {
  return useQuery<SpeakersResponse, Error>({
    queryKey: aiKeys.speakers(),
    queryFn: () => aiService.getSpeakers(),
    staleTime: 600_000,
  });
}
