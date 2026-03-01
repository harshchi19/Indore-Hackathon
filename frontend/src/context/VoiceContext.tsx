/**
 * Verdant Voice Context
 * =====================
 * Global voice settings and audio playback for Sarvam TTS integration.
 * 
 * Features:
 * - Voice toggle (on/off)
 * - Language selection (11 Indian languages)
 * - Speaker selection (10 personas)
 * - Auto-play notifications
 * - AI response voice output
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { aiService } from "@/services/aiService";
import type { TTSResponse } from "@/types/ai";

/* ── Types ───────────────────────────────────────────────────── */

export type VoiceLanguage = 
  | "hi-IN" | "en-IN" | "bn-IN" | "gu-IN" | "kn-IN" 
  | "ml-IN" | "mr-IN" | "od-IN" | "pa-IN" | "ta-IN" | "te-IN";

export type VoiceSpeaker = 
  | "aditya" | "rahul" | "rohan" | "shubh" | "amit" | "dev" | "kabir" | "varun"
  | "priya" | "ritu" | "neha" | "pooja" | "simran" | "kavya" | "anushka" | "shreya";

export type NotificationType = 
  | "welcome" | "contract_created" | "payment_success" 
  | "price_alert" | "certificate_earned" | "daily_summary";

export interface VoiceSettings {
  enabled: boolean;
  language: VoiceLanguage;
  speaker: VoiceSpeaker;
  autoPlayNotifications: boolean;
  autoPlayAIResponses: boolean;
  volume: number; // 0-1
}

export interface VoiceContextType {
  settings: VoiceSettings;
  isPlaying: boolean;
  isSpeaking: boolean;
  
  // Settings controls
  setEnabled: (enabled: boolean) => void;
  setLanguage: (lang: VoiceLanguage) => void;
  setSpeaker: (speaker: VoiceSpeaker) => void;
  setAutoPlayNotifications: (enabled: boolean) => void;
  setAutoPlayAIResponses: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  
  // Voice actions
  speak: (text: string, language?: VoiceLanguage) => Promise<void>;
  speakNotification: (type: NotificationType, params?: Record<string, unknown>) => Promise<void>;
  speakAIResponse: (text: string) => Promise<void>;
  stop: () => void;
  
  // Utility
  playAudio: (audioBase64: string, format?: string) => Promise<void>;
}

const LANGUAGE_NAMES: Record<VoiceLanguage, string> = {
  "hi-IN": "हिंदी (Hindi)",
  "en-IN": "English (India)",
  "bn-IN": "বাংলা (Bengali)",
  "gu-IN": "ગુજરાતી (Gujarati)",
  "kn-IN": "ಕನ್ನಡ (Kannada)",
  "ml-IN": "മലയാളം (Malayalam)",
  "mr-IN": "मराठी (Marathi)",
  "od-IN": "ଓଡ଼ିଆ (Odia)",
  "pa-IN": "ਪੰਜਾਬੀ (Punjabi)",
  "ta-IN": "தமிழ் (Tamil)",
  "te-IN": "తెలుగు (Telugu)",
};

const SPEAKER_INFO: Record<VoiceSpeaker, { name: string; gender: "male" | "female" }> = {
  aditya: { name: "Aditya", gender: "male" },
  rahul: { name: "Rahul", gender: "male" },
  rohan: { name: "Rohan", gender: "male" },
  shubh: { name: "Shubh", gender: "male" },
  amit: { name: "Amit", gender: "male" },
  dev: { name: "Dev", gender: "male" },
  kabir: { name: "Kabir", gender: "male" },
  varun: { name: "Varun", gender: "male" },
  priya: { name: "Priya", gender: "female" },
  ritu: { name: "Ritu", gender: "female" },
  neha: { name: "Neha", gender: "female" },
  pooja: { name: "Pooja", gender: "female" },
  simran: { name: "Simran", gender: "female" },
  kavya: { name: "Kavya", gender: "female" },
  anushka: { name: "Anushka", gender: "female" },
  shreya: { name: "Shreya", gender: "female" },
};

export { LANGUAGE_NAMES, SPEAKER_INFO };

/* ── Default Settings ────────────────────────────────────────── */

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: false,
  language: "hi-IN",
  speaker: "priya",
  autoPlayNotifications: true,
  autoPlayAIResponses: false,
  volume: 0.8,
};

/* ── Context ─────────────────────────────────────────────────── */

const VoiceContext = createContext<VoiceContextType | null>(null);

export function useVoice(): VoiceContextType {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
}

/* ── Provider ────────────────────────────────────────────────── */

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  // Load settings from localStorage
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    const stored = localStorage.getItem("verdant-voice-settings");
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const userInteractedRef = useRef(false);

  // Track first user interaction so we can respect autoplay policy
  useEffect(() => {
    const markInteracted = () => { userInteractedRef.current = true; };
    const events = ["click", "touchstart", "keydown"] as const;
    events.forEach(e => window.addEventListener(e, markInteracted, { once: true, capture: true }));
    return () => { events.forEach(e => window.removeEventListener(e, markInteracted, true)); };
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem("verdant-voice-settings", JSON.stringify(settings));
  }, [settings]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /* ── Settings Setters ──────────────────────────────────────── */

  const setEnabled = useCallback((enabled: boolean) => {
    setSettings(s => ({ ...s, enabled }));
  }, []);

  const setLanguage = useCallback((language: VoiceLanguage) => {
    setSettings(s => ({ ...s, language }));
  }, []);

  const setSpeaker = useCallback((speaker: VoiceSpeaker) => {
    setSettings(s => ({ ...s, speaker }));
  }, []);

  const setAutoPlayNotifications = useCallback((autoPlayNotifications: boolean) => {
    setSettings(s => ({ ...s, autoPlayNotifications }));
  }, []);

  const setAutoPlayAIResponses = useCallback((autoPlayAIResponses: boolean) => {
    setSettings(s => ({ ...s, autoPlayAIResponses }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setSettings(s => ({ ...s, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  /* ── Audio Playback ────────────────────────────────────────── */

  const playAudio = useCallback(async (audioBase64: string, format: string = "mp3") => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPlaying(true);

    try {
      // Decode base64 to blob
      const byteCharacters = atob(audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const mimeType = format === "wav" ? "audio/wav" : "audio/mpeg";
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);

      // Create audio element
      const audio = new Audio(url);
      audio.volume = settings.volume;
      audioRef.current = audio;

      // Play and cleanup
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsPlaying(false);
          resolve();
        };
        audio.onerror = (e) => {
          URL.revokeObjectURL(url);
          setIsPlaying(false);
          reject(e);
        };
        audio.play().catch((err) => {
          // Gracefully handle browser autoplay policy blocking
          if (err?.name === "NotAllowedError") {
            URL.revokeObjectURL(url);
            setIsPlaying(false);
            resolve(); // swallow — not a real error
          } else {
            reject(err);
          }
        });
      });
    } catch (error) {
      setIsPlaying(false);
      // Don't log autoplay policy errors — they're expected on first load
      if ((error as DOMException)?.name !== "NotAllowedError") {
        console.error("Voice playback failed:", error);
      }
      throw error;
    }
  }, [settings.volume]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsSpeaking(false);
  }, []);

  /* ── Voice Actions ─────────────────────────────────────────── */

  const speak = useCallback(async (text: string, language?: VoiceLanguage) => {
    if (!settings.enabled) return;
    
    setIsSpeaking(true);
    try {
      const response: TTSResponse = await aiService.speak({
        text,
        language: language || settings.language,
        speaker: settings.speaker,
      });
      await playAudio(response.audio_base64, response.audio_format);
    } catch (error) {
      console.error("Speech synthesis failed:", error);
    } finally {
      setIsSpeaking(false);
    }
  }, [settings.enabled, settings.language, settings.speaker, playAudio]);

  const speakNotification = useCallback(async (
    type: NotificationType, 
    params?: Record<string, unknown>
  ) => {
    if (!settings.enabled || !settings.autoPlayNotifications) return;
    // Skip if user hasn't interacted yet (browser will block autoplay)
    if (!userInteractedRef.current) return;
    
    setIsSpeaking(true);
    try {
      const response: TTSResponse = await aiService.speakNotification({
        notification_type: type,
        language: settings.language,
        params,
      });
      await playAudio(response.audio_base64, response.audio_format);
    } catch (error: any) {
      // Silently ignore voice service errors (503 = unavailable, 500 = API issue)
      // Voice is a nice-to-have; don't spam the console on every notification
      const status = error?.response?.status;
      if (status !== 500 && status !== 503) {
        console.warn("Notification voice unavailable");
      }
    } finally {
      setIsSpeaking(false);
    }
  }, [settings.enabled, settings.autoPlayNotifications, settings.language, playAudio]);

  const speakAIResponse = useCallback(async (text: string) => {
    if (!settings.enabled || !settings.autoPlayAIResponses) return;
    
    // Limit text length for TTS
    const truncatedText = text.length > 500 ? text.slice(0, 500) + "..." : text;
    
    setIsSpeaking(true);
    try {
      const response: TTSResponse = await aiService.speak({
        text: truncatedText,
        language: settings.language,
        speaker: settings.speaker,
      });
      await playAudio(response.audio_base64, response.audio_format);
    } catch (error) {
      console.error("AI voice response failed:", error);
    } finally {
      setIsSpeaking(false);
    }
  }, [settings.enabled, settings.autoPlayAIResponses, settings.language, settings.speaker, playAudio]);

  /* ── Context Value ─────────────────────────────────────────── */

  const value: VoiceContextType = {
    settings,
    isPlaying,
    isSpeaking,
    setEnabled,
    setLanguage,
    setSpeaker,
    setAutoPlayNotifications,
    setAutoPlayAIResponses,
    setVolume,
    speak,
    speakNotification,
    speakAIResponse,
    stop,
    playAudio,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}
