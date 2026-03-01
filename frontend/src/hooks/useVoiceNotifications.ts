/**
 * Voice Notifications Hook
 * ========================
 * Provides easy-to-use functions for triggering voice notifications
 * throughout the application.
 */

import { useCallback } from "react";
import { useVoice, type NotificationType } from "@/context/VoiceContext";
import { toast } from "sonner";

export function useVoiceNotifications() {
  const { speakNotification, speak, settings } = useVoice();

  /**
   * Welcome greeting for new users
   */
  const welcomeUser = useCallback(async (userName?: string) => {
    if (!settings.enabled) return;
    
    toast.success("Welcome to GreenGrid!", {
      description: "Your AI-powered green energy platform",
    });
    
    await speakNotification("welcome");
  }, [speakNotification, settings.enabled]);

  /**
   * Announce contract creation
   */
  const contractCreated = useCallback(async (contractId?: string) => {
    if (!settings.enabled) return;
    
    toast.success("Contract Created!", {
      description: "Your energy contract is now active",
    });
    
    await speakNotification("contract_created");
  }, [speakNotification, settings.enabled]);

  /**
   * Announce successful payment
   */
  const paymentSuccess = useCallback(async (amount: number) => {
    if (!settings.enabled) return;
    
    toast.success("Payment Successful!", {
      description: `₹${amount.toFixed(2)} processed`,
    });
    
    await speakNotification("payment_success", { amount: amount.toFixed(0) });
  }, [speakNotification, settings.enabled]);

  /**
   * Price alert announcement
   */
  const priceAlert = useCallback(async (
    energyType: string,
    price: number,
    change: number,
    direction: "up" | "down"
  ) => {
    if (!settings.enabled) return;
    
    const directionText = direction === "up" ? "increased" : "decreased";
    
    toast.info(`${energyType} Price Alert`, {
      description: `Now ₹${price}/kWh — ${change}% ${directionText}`,
    });
    
    await speakNotification("price_alert", {
      energy_type: energyType,
      price: price.toFixed(1),
      change: Math.abs(change).toFixed(0),
      direction: directionText,
    });
  }, [speakNotification, settings.enabled]);

  /**
   * Certificate earned announcement
   */
  const certificateEarned = useCallback(async (carbonSaved: number) => {
    if (!settings.enabled) return;
    
    toast.success("Certificate Earned! 🎉", {
      description: `You saved ${carbonSaved.toFixed(0)}kg CO₂`,
    });
    
    await speakNotification("certificate_earned", {
      carbon: carbonSaved.toFixed(0),
    });
  }, [speakNotification, settings.enabled]);

  /**
   * Daily summary announcement
   */
  const dailySummary = useCallback(async (
    consumption: number,
    comparisonText: string
  ) => {
    if (!settings.enabled) return;
    
    const hour = new Date().getHours();
    let timeOfDay = "morning";
    if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    if (hour >= 17) timeOfDay = "evening";
    
    toast.info("Daily Summary", {
      description: `${consumption.toFixed(1)} kWh consumed today`,
    });
    
    await speakNotification("daily_summary", {
      time_of_day: timeOfDay,
      consumption: consumption.toFixed(1),
      comparison: comparisonText,
    });
  }, [speakNotification, settings.enabled]);

  /**
   * Custom announcement
   */
  const customAnnouncement = useCallback(async (text: string) => {
    if (!settings.enabled) return;
    await speak(text);
  }, [speak, settings.enabled]);

  return {
    welcomeUser,
    contractCreated,
    paymentSuccess,
    priceAlert,
    certificateEarned,
    dailySummary,
    customAnnouncement,
    isEnabled: settings.enabled,
  };
}
