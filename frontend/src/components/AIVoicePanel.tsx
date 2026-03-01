import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Globe,
  Play,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useVoiceSpeak, useVoiceLanguages, useVoiceSpeakers } from "@/hooks/useAI";

const POPULAR_LANGUAGES = [
  { code: "hi-IN", name: "Hindi" },
  { code: "en-IN", name: "English" },
  { code: "mr-IN", name: "Marathi" },
  { code: "ta-IN", name: "Tamil" },
  { code: "te-IN", name: "Telugu" },
  { code: "bn-IN", name: "Bengali" },
  { code: "gu-IN", name: "Gujarati" },
  { code: "kn-IN", name: "Kannada" },
  { code: "ml-IN", name: "Malayalam" },
  { code: "pa-IN", name: "Punjabi" },
  { code: "od-IN", name: "Odia" },
];

const POPULAR_SPEAKERS = [
  { name: "Aditya", gender: "Male" },
  { name: "Priya", gender: "Female" },
  { name: "Rahul", gender: "Male" },
  { name: "Ritu", gender: "Female" },
  { name: "Rohan", gender: "Male" },
  { name: "Neha", gender: "Female" },
];

interface AIVoicePanelProps {
  className?: string;
}

const AIVoicePanel = ({ className = "" }: AIVoicePanelProps) => {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("hi-IN");
  const [speaker, setSpeaker] = useState("Aditya");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakMutation = useVoiceSpeak();
  const { data: langData } = useVoiceLanguages();
  const { data: speakerData } = useVoiceSpeakers();

  const languages = langData?.languages ?? POPULAR_LANGUAGES;
  const speakers = speakerData?.speakers ?? POPULAR_SPEAKERS;

  const handleSpeak = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || speakMutation.isPending) return;

    speakMutation.mutate(
      { text: trimmed, language, speaker },
      {
        onSuccess: (data) => {
          // Stop any currently playing audio
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }

          // Play base64 audio
          const audioSrc = `data:audio/${data.audio_format};base64,${data.audio_base64}`;
          const audio = new Audio(audioSrc);
          audioRef.current = audio;
          setIsPlaying(true);

          audio.onended = () => setIsPlaying(false);
          audio.onerror = () => setIsPlaying(false);
          audio.play().catch(() => setIsPlaying(false));
        },
      },
    );
  }, [text, language, speaker, speakMutation]);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const selectedLangName =
    languages.find((l) => l.code === language)?.name ?? language;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl p-5 border border-border ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="w-3.5 h-3.5 text-primary" />
        <h3 className="font-heading font-semibold text-foreground text-sm">
          AI Voice (TTS)
        </h3>
        <span className="text-[9px] text-muted-foreground ml-auto">
          Sarvam Bulbul
        </span>
      </div>

      {/* Text input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type text to speak in any Indian language..."
        rows={3}
        className="w-full bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 border border-border focus:border-primary/30 outline-none resize-none mb-3 transition-colors"
      />

      {/* Language & Speaker selectors */}
      <div className="flex items-center gap-2 mb-3">
        {/* Language dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="w-full flex items-center justify-between gap-2 bg-muted/30 rounded-lg px-3 py-2 text-xs text-foreground border border-border hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-primary" />
              <span>{selectedLangName}</span>
            </div>
            <ChevronDown
              className={`w-3 h-3 text-muted-foreground transition-transform ${showLangPicker ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {showLangPicker && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-[160px] overflow-y-auto"
              >
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangPicker(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-muted/50 transition-colors ${
                      language === l.code
                        ? "text-primary font-medium"
                        : "text-foreground"
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Speaker selector */}
        <select
          value={speaker}
          onChange={(e) => setSpeaker(e.target.value)}
          className="bg-muted/30 rounded-lg px-3 py-2 text-xs text-foreground border border-border hover:border-primary/20 transition-colors outline-none cursor-pointer"
        >
          {speakers.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} ({s.gender})
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSpeak}
          disabled={!text.trim() || speakMutation.isPending}
          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed glossy"
        >
          {speakMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Speak
            </>
          )}
        </button>
        {isPlaying && (
          <button
            onClick={handleStop}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Last result info */}
      {speakMutation.data && (
        <p className="text-[9px] text-muted-foreground mt-2">
          Last: {speakMutation.data.speaker} ({speakMutation.data.language}) •{" "}
          {speakMutation.data.duration_seconds.toFixed(1)}s
        </p>
      )}

      {/* Error */}
      {speakMutation.isError && (
        <p className="text-[10px] text-destructive mt-2">
          Voice service unavailable. Check Sarvam API key.
        </p>
      )}
    </motion.div>
  );
};

export default AIVoicePanel;
