// AI Assistant – full chat UI + concept explainer + daily energy tip.
// Calls: /ai/chat, /ai/chat/clear, /ai/explain, /ai/tip, /ai/models
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/ui/PageTransition";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Send, RefreshCw, Trash2, Sparkles, Lightbulb, BookOpen,
  ChevronRight, Loader2, User, Bot, Zap, Code2, Cpu, MessageSquare,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAIChat, useAIClearHistory, useAIExplain, useAITip, useAIModels } from "@/hooks/useAI";
import type { ChatMessage } from "@/types/ai";

/* ── Concept list ─────────────────────────────────────── */
const CONCEPTS = [
  "Renewable Energy Certificate (REC)",
  "Net Metering",
  "Peer-to-Peer Energy Trading",
  "Carbon Credit",
  "Power Purchase Agreement",
  "Smart Energy Contract",
  "Feed-In Tariff",
  "Energy Storage (Battery)",
];

const SUGGESTED_QUESTIONS = [
  "How do I reduce my energy costs?",
  "What is the best time to buy solar energy?",
  "How do carbon credits work in India?",
  "Explain peer-to-peer energy trading",
  "What are RECs and how can I earn them?",
];

const msgVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [conceptResult, setConceptResult] = useState<{ concept: string; explanation: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useAIChat();
  const clearMutation = useAIClearHistory();
  const explainMutation = useAIExplain();
  const { data: tip, isLoading: tipLoading } = useAITip();
  const { data: models } = useAIModels();

  /* Auto-scroll */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || chatMutation.isPending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await chatMutation.mutateAsync({ message: content, use_history: true });
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.message,
        timestamp: new Date(),
        suggestions: res.suggestions,
        tokens_used: res.tokens_used,
        model: res.model,
        provider: res.provider,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  }, [input, chatMutation]);

  const handleClear = async () => {
    setMessages([]);
    setInput("");
    await clearMutation.mutateAsync("current-user").catch(() => null);
  };

  const handleExplain = async (concept: string) => {
    setSelectedConcept(concept);
    setConceptResult(null);
    try {
      const res = await explainMutation.mutateAsync({ concept });
      setConceptResult(res);
    } catch {
      setConceptResult({ concept, explanation: "Failed to load explanation. Please try again." });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative">
          <FloatingOrbs />
          <div className="max-w-[1300px] mx-auto space-y-6 relative z-10">

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
                  background: "linear-gradient(135deg, hsl(142 72% 35% / 0.9), hsl(270 60% 55% / 0.7), hsl(142 72% 40% / 0.5))",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <div className="absolute inset-0 grain opacity-30" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs mb-4">
                    <Brain className="w-3 h-3 text-white" />
                    <span className="text-white font-medium">Powered by Groq · Gemini · Sarvam</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                    AI Energy Assistant
                  </h1>
                  <p className="text-sm text-white/70 max-w-lg">
                    Ask anything about energy trading, carbon credits, renewables, and the Verdant platform. Get instant expert answers.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {models && (
                    <>
                      <div className="text-center">
                        <p className="text-xs text-white/60 mb-1">Primary</p>
                        <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-mono">{models.assistant.primary}</span>
                      </div>
                      <div className="w-px h-8 bg-white/20" />
                      <div className="text-center">
                        <p className="text-xs text-white/60 mb-1">Fallback</p>
                        <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-mono">{models.assistant.fallback}</span>
                      </div>
                    </>
                  )}
                  <Button onClick={handleClear} className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2">
                    <Trash2 className="w-4 h-4" /> Clear Chat
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* ── Stat rows ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                { label: "Messages Sent", value: messages.filter(m => m.role === "user").length.toString(), icon: MessageSquare, gradient: "from-primary/20 to-primary/5" },
                { label: "AI Responses", value: messages.filter(m => m.role === "assistant").length.toString(), icon: Bot, gradient: "from-accent/20 to-accent/5" },
                { label: "Models Active", value: models ? "3" : "—", icon: Cpu, gradient: "from-primary/20 to-accent/5" },
                { label: "Concepts Available", value: CONCEPTS.length.toString(), icon: BookOpen, gradient: "from-saffron/20 to-saffron/5" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className={`rounded-xl p-5 bg-gradient-to-br ${stat.gradient} border border-border/50`}
                >
                  <stat.icon className="w-5 h-5 text-muted-foreground mb-3" />
                  <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* ── Main layout: Chat | Sidebar ── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

              {/* Chat panel */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden"
                style={{ minHeight: "560px" }}
              >
                {/* Chat header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium text-foreground">Chat</span>
                    {chatMutation.isPending && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> AI is thinking…
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleClear}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                  <AnimatePresence initial={false}>
                    {messages.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-full py-16 gap-4 text-center"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Sparkles className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Start a conversation</p>
                          <p className="text-xs text-muted-foreground mt-1">Ask about energy markets, trading strategies, or platform features.</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center max-w-md">
                          {SUGGESTED_QUESTIONS.map((q) => (
                            <button
                              key={q}
                              onClick={() => sendMessage(q)}
                              className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          variants={msgVariants}
                          initial="hidden"
                          animate="visible"
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}
                        >
                          {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                              <Bot className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                            <div
                              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                                  : "bg-muted/50 text-foreground border border-border rounded-tl-sm"
                              }`}
                            >
                              {msg.content}
                            </div>
                            {msg.role === "assistant" && msg.model && (
                              <span className="text-[10px] text-muted-foreground px-1 flex items-center gap-1">
                                <Code2 className="w-2.5 h-2.5" />
                                {msg.provider} · {msg.model} · {msg.tokens_used} tokens
                              </span>
                            )}
                            {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {msg.suggestions.map((s, si) => (
                                  <button
                                    key={si}
                                    onClick={() => sendMessage(s)}
                                    className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                            <span className="text-[10px] text-muted-foreground px-1">
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0 mt-1">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                  {chatMutation.isPending && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary animate-pulse" />
                      </div>
                      <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1 items-center h-4">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input bar */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about energy trading, renewable markets, carbon credits…  (Enter to send)"
                      rows={2}
                      className="flex-1 resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 scrollbar-thin"
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || chatMutation.isPending}
                      className="h-[54px] w-12 px-0 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center"
                    >
                      {chatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Right sidebar */}
              <div className="space-y-5">

                {/* Daily Tip */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-saffron/10 flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-saffron" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Daily Energy Tip</h3>
                  </div>
                  {tipLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 bg-muted/40 rounded w-full" />
                      <div className="h-3 bg-muted/40 rounded w-4/5" />
                      <div className="h-3 bg-muted/40 rounded w-3/5" />
                    </div>
                  ) : tip ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{tip.tip}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Could not load tip.</p>
                  )}
                  <button
                    onClick={() => tip && sendMessage(`Tell me more about: ${tip.tip}`)}
                    disabled={!tip}
                    className="mt-3 text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Ask AI about this <ChevronRight className="w-3 h-3" />
                  </button>
                </motion.div>

                {/* Concept Explainer */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Concept Explainer</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">Click any concept to get an AI explanation.</p>

                  <div className="flex flex-col gap-1.5">
                    {CONCEPTS.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleExplain(c)}
                        disabled={explainMutation.isPending && selectedConcept === c}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors border ${
                          selectedConcept === c
                            ? "border-primary/50 bg-primary/5 text-primary"
                            : "border-border hover:border-primary/30 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>{c}</span>
                        {explainMutation.isPending && selectedConcept === c ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ChevronRight className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Concept result */}
                  <AnimatePresence mode="wait">
                    {conceptResult && (
                      <motion.div
                        key={conceptResult.concept}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 rounded-xl bg-muted/30 border border-border p-4"
                      >
                        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-primary" />
                          {conceptResult.concept}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{conceptResult.explanation}</p>
                        <button
                          onClick={() => sendMessage(`I want to learn more about: ${conceptResult.concept}`)}
                          className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Continue in chat <ChevronRight className="w-3 h-3" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
