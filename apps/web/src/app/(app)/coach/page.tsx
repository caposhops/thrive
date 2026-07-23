"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Cloud, HardDrive, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/supabase/use-user";
import {
  fetchCoachHistory,
  saveCoachMessage,
  clearCoachHistory,
} from "@/lib/supabase/coach";

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
  const { user, loading: authLoading } = useUser();
  // localStorage is the always-on fallback for anonymous users + offline resilience
  const [localMessages, setLocalMessages] = useLocalStorage<Message[]>(
    "thrive:coach",
    seed,
  );
  const [cloudMessages, setCloudMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAuthed = !!user;
  const messages: Message[] = isAuthed ? (cloudMessages ?? []) : localMessages;

  // Hydrate from cloud on sign-in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCloudMessages(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const rows = await fetchCoachHistory(user.id);
      if (cancelled) return;
      const hist = rows.map((r) => ({
        id: r.id,
        role: r.role === "coach" ? ("coach" as const) : ("user" as const),
        text: r.content,
      }));
      // If empty history (first sign-in), keep the seed welcome + save it
      if (hist.length === 0) {
        setCloudMessages(seed);
        void saveCoachMessage(user.id, "coach", seed[0].text);
      } else {
        setCloudMessages(hist);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Auto-scroll to newest
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const setMessages = (updater: (prev: Message[]) => Message[]) => {
    if (isAuthed) {
      setCloudMessages((prev) => updater(prev ?? []));
    } else {
      setLocalMessages(updater);
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
    const next = [...messages, userMsg];
    setMessages(() => next);
    setDraft("");
    setThinking(true);

    // Fire-and-forget cloud save for user's message
    if (user) {
      void saveCoachMessage(user.id, "user", text);
    }

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, text }) => ({ role, text })),
        }),
      });
      const data = (await res.json()) as { reply: string };
      const coachMsg: Message = {
        id: crypto.randomUUID(),
        role: "coach",
        text: data.reply,
      };
      setMessages((m) => [...m, coachMsg]);
      if (user) {
        void saveCoachMessage(user.id, "coach", data.reply);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "coach",
          text: "Something interrupted us. Try once more?",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const doClear = async () => {
    if (isAuthed && user) {
      await clearCoachHistory(user.id);
      setCloudMessages(seed);
      await saveCoachMessage(user.id, "coach", seed[0].text);
    } else {
      setLocalMessages(seed);
    }
    setConfirmClear(false);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-14rem)] w-full max-w-3xl flex-col sm:h-[calc(100vh-8rem)]">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
            <Sparkles className="h-5 w-5 text-black" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Coach</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">A calm mentor</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] tracking-wide text-fg-subtle">
              {isAuthed ? (
                <>
                  <Cloud className="h-2.5 w-2.5 text-teal-300" />
                  <span className="text-teal-300">Synced</span>
                  <span>· conversation lives on your account</span>
                </>
              ) : (
                <>
                  <HardDrive className="h-2.5 w-2.5" />
                  <span>Local · this device only</span>
                </>
              )}
            </p>
          </div>
        </div>
        {messages.length > 1 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="glass shrink-0 rounded-full p-2 text-fg-subtle transition-colors hover:text-fg"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </header>

      {confirmClear && (
        <div className="mb-4 glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-fg-muted">
            Clear the whole conversation? This can&apos;t be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={doClear}
              className="inline-flex h-9 items-center rounded-full bg-rose-500/20 px-4 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/30"
            >
              Yes, clear
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="inline-flex h-9 items-center rounded-full bg-white/[0.05] px-4 text-xs font-medium text-fg-muted transition-colors hover:bg-white/[0.1] hover:text-fg"
            >
              Keep it
            </button>
          </div>
        </div>
      )}

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
                "max-w-[85%] rounded-3xl px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap",
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
              <span
                className="h-2 w-2 animate-pulse-glow rounded-full bg-rose-400"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="h-2 w-2 animate-pulse-glow rounded-full bg-amber-400"
                style={{ animationDelay: "0.4s" }}
              />
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
            aria-label="Message the coach"
          />
        </div>
        <button
          type="submit"
          disabled={!draft.trim() || thinking}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-black shadow-glow transition-all active:scale-95 disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
