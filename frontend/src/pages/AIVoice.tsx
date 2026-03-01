// AI Voice Centre — TTS synthesis + notification templates.
// Calls: /ai/voice/speak, /ai/voice/notification, /ai/voice/languages, /ai/voice/speakers
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Play, Pause, Volume2, Loader2, ChevronDown, Globe, User,
  Bell, Sparkles, CheckCircle, CreditCard, TrendingDown, Award, Activity,
  AlertCircle, Languages,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  useVoiceSpeak, useVoiceNotification,
  useVoiceLanguages, useVoiceSpeakers,
} from "@/hooks/useAI";

/* ── Notification templates ───────────────────────────── */
interface NotificationTemplate {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  params: Record<string, unknown>;
  preview: string;
}

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    type: "welcome",
    label: "Welcome",
    icon: Sparkles,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    params: { user_name: "Arjun" },
    preview: "Welcome greeting for new users",
  },
  {
    type: "contract_created",
    label: "Contract Created",
    icon: CheckCircle,
    color: "text-accent",
    bg: "bg-accent/10 border-accent/20",
    params: { contract_id: "C-2026-001", volume: "100 kWh", amount: "450" },
    preview: "Contract successfully created notification",
  },
  {
    type: "payment_success",
    label: "Payment Success",
    icon: CreditCard,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    params: { amount: "450", currency: "INR" },
    preview: "Payment received confirmation",
  },
  {
    type: "price_alert",
    label: "Price Alert",
    icon: TrendingDown,
    color: "text-saffron",
    bg: "bg-saffron/10 border-saffron/20",
    params: { source: "solar", direction: "down", percentage: "5" },
    preview: "Solar price dropped — buy opportunity",
  },
  {
    type: "certificate_earned",
    label: "Certificate Earned",
    icon: Award,
    color: "text-accent",
    bg: "bg-accent/10 border-accent/20",
    params: { energy_source: "solar", kwh: "100" },
    preview: "New REC certificate issued",
  },
  {
    type: "daily_summary",
    label: "Daily Summary",
    icon: Activity,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    params: { consumption: "45.2", comparison: "3% less than" },
    preview: "Daily energy consumption summary",
  },
];

/* ── Audio player hook ────────────────────────────────── */
function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const playAudio = useCallback((base64: string, format: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const mimeType = format.includes("wav") ? "audio/wav" : format.includes("mp3") ? "audio/mpeg" : "audio/mpeg";
    const src = `data:${mimeType};base64,${base64}`;
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.oncanplaythrough = () => {
      setDuration(audio.duration);
      setIsPlaying(true);
      audio.play().catch(() => setIsPlaying(false));
    };
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  return { isPlaying, duration, playAudio, togglePlay };
}

/* ── Waveform decoration ──────────────────────────────── */
function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px] h-8">
      {Array.from({ length: 20 }, (_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-300 ${active ? "bg-primary" : "bg-muted-foreground/30"}`}
          style={{
            width: 3,
            height: active
              ? `${20 + Math.sin(i * 0.7 + Date.now() / 300) * 14}px`
              : `${6 + Math.sin(i * 0.9) * 10}px`,
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default function AIVoice() {
  const [text, setText] = useState("नमस्ते! वर्डेंट एनर्जी प्लेटफॉर्म में आपका स्वागत है। आज सौर ऊर्जा की कीमत 5.2 रुपये प्रति किलोवाट घंटे है।");
  const [selectedLanguage, setSelectedLanguage] = useState("hi-IN");
  const [selectedSpeaker, setSelectedSpeaker] = useState("meera");
  const [selectedGender, setSelectedGender] = useState<"all" | "male" | "female">("all");
  const [ttsResult, setTtsResult] = useState<{ duration: number; language: string; speaker: string } | null>(null);
  const [playingTemplate, setPlayingTemplate] = useState<string | null>(null);
  const [notifLanguage, setNotifLanguage] = useState("hi-IN");

  const { isPlaying, playAudio, togglePlay } = useAudioPlayer();

  const speakMutation = useVoiceSpeak();
  const notifMutation = useVoiceNotification();
  const { data: languagesData, isLoading: langsLoading } = useVoiceLanguages();
  const { data: speakersData, isLoading: speakersLoading } = useVoiceSpeakers();

  const languages = languagesData?.languages ?? [];
  const speakers = speakersData?.speakers ?? [];
  const filteredSpeakers = selectedGender === "all" ? speakers : speakers.filter(s => s.gender === selectedGender);

  const handleSpeak = async () => {
    if (!text.trim()) return;
    try {
      const res = await speakMutation.mutateAsync({
        text,
        language: selectedLanguage,
        speaker: selectedSpeaker,
      });
      setTtsResult({ duration: res.duration_seconds, language: res.language, speaker: res.speaker });
      playAudio(res.audio_base64, res.audio_format);
    } catch {
      // error handled by mutation state
    }
  };

  const handleNotification = async (template: NotificationTemplate) => {
    setPlayingTemplate(template.type);
    try {
      const res = await notifMutation.mutateAsync({
        notification_type: template.type,
        language: notifLanguage,
        params: template.params,
      });
      playAudio(res.audio_base64, res.audio_format);
    } catch {
      // ignore
    } finally {
      setPlayingTemplate(null);
    }
  };

  const currentLangName = languages.find(l => l.code === selectedLanguage)?.name ?? selectedLanguage;

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative">
          <FloatingOrbs />
          <div className="max-w-[1200px] mx-auto space-y-6 relative z-10">

            {/* ── Hero Banner ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-8 lg:p-10"
            >
              <div
                className="absolute inset-0 animate-energy-flow"
                style={{
                  backgroundSize: "200% 200%",
                  background: "linear-gradient(135deg, hsl(270 65% 50% / 0.9), hsl(142 72% 35% / 0.7), hsl(200 80% 45% / 0.5))",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Mic className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Sarvam AI · Bulbul TTS · 11 Indian Languages</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    AI Voice Centre
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Convert text to natural-sounding speech in 11 Indian languages with 10 voice personas, or trigger smart notification audio.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    {langsLoading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin mx-auto" />
                    ) : (
                      <p className="text-3xl font-heading font-bold text-white">{languages.length || 11}</p>
                    )}
                    <p className="text-[11px] text-white/60 mt-1">Languages</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    {speakersLoading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin mx-auto" />
                    ) : (
                      <p className="text-3xl font-heading font-bold text-white">{speakers.length || 10}</p>
                    )}
                    <p className="text-[11px] text-white/60 mt-1">Voice Personas</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-3xl font-heading font-bold text-white">{NOTIFICATION_TEMPLATES.length}</p>
                    <p className="text-[11px] text-white/60 mt-1">Templates</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">

              {/* ── TTS Panel ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-border bg-card p-6 space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Text to Speech</h2>
                    <p className="text-xs text-muted-foreground">Enter any text and synthesize it with the selected voice</p>
                  </div>
                </div>

                {/* Text input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-medium text-muted-foreground">Text to Synthesize</label>
                    <span className="text-muted-foreground">{text.length} / 1000</span>
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 1000))}
                    rows={5}
                    placeholder="Enter text in any supported Indian language…"
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none scrollbar-thin"
                  />
                </div>

                {/* Quick text presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Hindi greeting", text: "नमस्ते! आज सौर ऊर्जा से 45 किलोवाट घंटे उत्पन्न हुई। बाज़ार में कीमत 5.2 रुपये है।" },
                    { label: "English (Indian)", text: "Hello! Today's solar energy production reached 45 kilowatt hours. Current market rate is ₹5.20 per unit." },
                    { label: "Tamil", text: "வணக்கம்! இன்று சூரிய ஆற்றல் உற்பத்தி 45 கிலோவாட் மணிகளை எட்டியது." },
                    { label: "Bengali", text: "নমস্কার! আজ সৌর শক্তি উৎপাদন ৪৫ কিলোওয়াট ঘণ্টায় পৌঁছেছে।" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setText(preset.text);
                        const lang = preset.label === "English (Indian)" ? "en-IN" : preset.label === "Tamil" ? "ta-IN" : preset.label === "Bengali" ? "bn-IN" : "hi-IN";
                        setSelectedLanguage(lang);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Language + Speaker row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Language */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Globe className="w-3 h-3" /> Language
                    </label>
                    <div className="relative">
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        disabled={langsLoading}
                        className="w-full appearance-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 pr-8"
                      >
                        {langsLoading ? (
                          <option>Loading…</option>
                        ) : languages.length > 0 ? (
                          languages.map((l) => (
                            <option key={l.code} value={l.code}>{l.name} ({l.code})</option>
                          ))
                        ) : (
                          // Fallback list while API loads
                          [
                            ["hi-IN", "Hindi"], ["en-IN", "English (India)"], ["bn-IN", "Bengali"],
                            ["gu-IN", "Gujarati"], ["kn-IN", "Kannada"], ["ml-IN", "Malayalam"],
                            ["mr-IN", "Marathi"], ["od-IN", "Odia"], ["pa-IN", "Punjabi"],
                            ["ta-IN", "Tamil"], ["te-IN", "Telugu"],
                          ].map(([code, name]) => (
                            <option key={code} value={code}>{name} ({code})</option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Speaker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Voice Persona
                    </label>
                    <div className="space-y-2">
                      {/* Gender filter */}
                      <div className="flex gap-1.5">
                        {(["all", "male", "female"] as const).map((g) => (
                          <button
                            key={g}
                            onClick={() => {
                              setSelectedGender(g);
                              const newList = g === "all" ? speakers : speakers.filter(s => s.gender === g);
                              if (newList.length > 0) setSelectedSpeaker(newList[0].name);
                            }}
                            className={`flex-1 text-[11px] py-1 rounded-lg border capitalize transition-colors ${
                              selectedGender === g
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <select
                          value={selectedSpeaker}
                          onChange={(e) => setSelectedSpeaker(e.target.value)}
                          disabled={speakersLoading}
                          className="w-full appearance-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 pr-8"
                        >
                          {speakersLoading ? (
                            <option>Loading…</option>
                          ) : filteredSpeakers.length > 0 ? (
                            filteredSpeakers.map((s) => (
                              <option key={s.name} value={s.name}>
                                {s.name} ({s.gender === "male" ? "♂" : "♀"})
                              </option>
                            ))
                          ) : (
                            <option value={selectedSpeaker}>{selectedSpeaker}</option>
                          )}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Speak button */}
                <Button
                  onClick={handleSpeak}
                  disabled={speakMutation.isPending || !text.trim()}
                  size="lg"
                  className="w-full gap-2 text-sm"
                >
                  {speakMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Synthesizing speech…</>
                  ) : (
                    <><Mic className="w-4 h-4" /> Synthesize Speech</>
                  )}
                </Button>

                {/* Audio result */}
                <AnimatePresence>
                  {(ttsResult || isPlaying) && (
                    <motion.div
                      key="audio"
                      initial={{ opacity: 0, y: 6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl bg-primary/5 border border-primary/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={togglePlay}
                            className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0"
                          >
                            {isPlaying ? <Pause className="w-4 h-4 text-primary-foreground" /> : <Play className="w-4 h-4 text-primary-foreground" />}
                          </button>
                          <Waveform active={isPlaying} />
                        </div>
                        {ttsResult && (
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-shrink-0">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{ttsResult.language}</span>
                            <span>{ttsResult.speaker}</span>
                            <span>{ttsResult.duration.toFixed(1)}s</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {speakMutation.isError && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-xs text-destructive">Speech synthesis failed. Ensure SARVAM_API_KEY is configured.</p>
                  </div>
                )}
              </motion.div>

              {/* ── Notification Templates Panel ── */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card p-6 space-y-4"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-saffron/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-saffron" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Smart Notifications</h2>
                    <p className="text-xs text-muted-foreground">Play contextual voice alerts in your language</p>
                  </div>
                </div>

                {/* Notification language picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Languages className="w-3 h-3" /> Notification Language
                  </label>
                  <div className="relative">
                    <select
                      value={notifLanguage}
                      onChange={(e) => setNotifLanguage(e.target.value)}
                      disabled={langsLoading}
                      className="w-full appearance-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 pr-8"
                    >
                      {languages.length > 0 ? (
                        languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)
                      ) : (
                        [["hi-IN", "Hindi"], ["en-IN", "English (India)"], ["ta-IN", "Tamil"]].map(([c, n]) => (
                          <option key={c} value={c}>{n}</option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Template cards */}
                <div className="space-y-2.5">
                  {NOTIFICATION_TEMPLATES.map((tmpl) => {
                    const isLoading = playingTemplate === tmpl.type && notifMutation.isPending;
                    return (
                      <motion.div
                        key={tmpl.type}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`rounded-xl border p-4 cursor-pointer transition-colors ${tmpl.bg} hover:opacity-90`}
                        onClick={() => !notifMutation.isPending && handleNotification(tmpl)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center`}>
                              <tmpl.icon className={`w-4 h-4 ${tmpl.color}`} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{tmpl.label}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{tmpl.preview}</p>
                            </div>
                          </div>
                          <button
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                              isLoading ? "bg-muted/50" : "bg-white/60 hover:bg-white/90"
                            }`}
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                            ) : (
                              <Play className={`w-3.5 h-3.5 ${tmpl.color}`} />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {notifMutation.isError && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-xs text-destructive">Notification synthesis failed. Check SARVAM_API_KEY.</p>
                  </div>
                )}

                {/* Info footer */}
                <div className="rounded-xl bg-muted/30 border border-border p-3">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Bulbul TTS</span> by Sarvam AI — India's leading multilingual speech synthesis model, optimised for natural Indian language prosody and accent.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
