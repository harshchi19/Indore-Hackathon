import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  X,
  Trash2,
  Sparkles,
  Bot,
  User,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { useAIChat, useAIClearHistory, useAITip } from "@/hooks/useAI";
import type { ChatMessage } from "@/types/ai";

interface AIChatPanelProps {
  userId?: string;
}

const AIChatPanel = ({ userId = "anonymous" }: AIChatPanelProps) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useAIChat();
  const clearMutation = useAIClearHistory();
  const { data: tipData } = useAITip();

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    chatMutation.mutate(
      { message: text, user_id: userId, use_history: true },
      {
        onSuccess: (data) => {
          const assistantMsg: ChatMessage = {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
            suggestions: data.suggestions,
            tokens_used: data.tokens_used,
            model: data.model,
            provider: data.provider,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        onError: (err) => {
          const errorMsg: ChatMessage = {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: `Sorry, something went wrong: ${err.message}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        },
      },
    );
  }, [input, chatMutation, userId]);

  const handleClear = useCallback(() => {
    clearMutation.mutate(userId, {
      onSuccess: () => setMessages([]),
    });
  }, [clearMutation, userId]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInput(suggestion);
    },
    [],
  );

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 transition-colors flex items-center justify-center glossy"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[9999] w-[380px] h-[560px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-semibold text-foreground">
                    Verdant AI
                  </h3>
                  <p className="text-[9px] text-muted-foreground">
                    Energy assistant
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  disabled={clearMutation.isPending || messages.length === 0}
                  className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            >
              {/* Welcome message */}
              {messages.length === 0 && (
                <div className="text-center pt-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground">
                      Hi! I'm Verdant AI
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
                      Ask me about energy trading, prices, sustainability, or
                      anything about green energy.
                    </p>
                  </div>
                  {/* Energy Tip */}
                  {tipData?.tip && (
                    <div className="mx-2 rounded-xl bg-accent/5 border border-accent/10 p-3 text-left">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Lightbulb className="w-3 h-3 text-accent" />
                        <span className="text-[10px] font-medium text-accent">
                          Energy Tip
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground leading-relaxed">
                        {tipData.tip}
                      </p>
                    </div>
                  )}
                  {/* Quick suggestions */}
                  <div className="flex flex-wrap gap-1.5 justify-center px-2">
                    {[
                      "What is green energy trading?",
                      "Best time to buy solar?",
                      "How do RECs work?",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                        }}
                        className="text-[10px] px-2.5 py-1.5 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message list */}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted/50 text-foreground border border-border rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.model && (
                      <p className="text-[8px] opacity-50 mt-1">
                        {msg.provider} • {msg.tokens_used} tokens
                      </p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-accent" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {chatMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 items-center"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-muted/50 rounded-xl px-3 py-2 border border-border">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                </motion.div>
              )}

              {/* Suggestions from last assistant message */}
              {messages.length > 0 &&
                messages[messages.length - 1].role === "assistant" &&
                messages[messages.length - 1].suggestions &&
                messages[messages.length - 1].suggestions!.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-8">
                    {messages[messages.length - 1].suggestions!.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestionClick(s)}
                        className="text-[10px] px-2 py-1 rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-colors border border-primary/10"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2 border border-border focus-within:border-primary/30 transition-colors">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask about energy trading..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  disabled={chatMutation.isPending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || chatMutation.isPending}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatPanel;
