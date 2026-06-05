"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "coach";
  text: string;
};

const seed: Message[] = [
  {
    id: "1",
    role: "coach",
    text: "Welcome back. Before we talk about today — take one slow breath in for me. … And out. What's most alive in you right now?",
  },
];

const prompts = [
  "I keep procrastinating on something important.",
  "I want to redesign my mornings.",
  "I feel scattered today.",
  "Help me set a 30-day focus.",
];

export default function CoachPage() {
  const [messages, setMessages] = useLocalStorage<Message[]>("thrive:coach", seed);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
    const next = [...messages, userMsg];
    setMessages(next);
    setDraft("");
    setThinking(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, text }) => ({ role, text })),
        }),
      });
      const data = (await res.json()) as { reply: string };
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "coach", text: data.reply },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "coach", text: "Something interrupted us. Try once more?" },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-14rem)] w-full max-w-3xl flex-col sm:h-[calc(100vh-8rem)]">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
            <Sparkles className="h-5 w-5 text-black" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Coach</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">A calm mentor</h1>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-3xl px-5 py-3.5 text-[15px] leading-relaxed",
                m.role === "user"
                  ? "bg-gradient-brand text-black shadow-glow"
                  : "glass text-fg",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="glass flex items-center gap-1.5 rounded-3xl px-5 py-4">
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-violet-400" />
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-rose-400" style={{ animationDelay: "0.2s" }} />
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-amber-400" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
      </div>

      {messages.length <= 2 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="glass rounded-full px-4 py-2 text-sm text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="mt-4 flex items-center gap-2"
      >
        <div className="glass-strong flex h-14 flex-1 items-center gap-2 rounded-full px-5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share what's on your mind…"
            className="h-full flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
          />
        </div>
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-black shadow-glow transition-all active:scale-95 disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

