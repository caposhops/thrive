"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, Cloud, HardDrive, Trash2, ChevronRight, WifiOff, Volume2, VolumeX } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/supabase/use-user";
import {
  fetchCoachHistory,
  saveCoachMessage,
  clearCoachHistory,
} from "@/lib/supabase/coach";
import { fetchCoachContext, renderCoachContext } from "@/lib/coach-context";
import { fetchCoachStyle } from "@/lib/supabase/profile";
import {
  DEFAULT_STYLE,
  resolveStyle,
  type CoachStyleKey,
} from "@/lib/coach-styles";
import { pickCoachWelcome } from "@/lib/coach-welcomes";
import { MicButton } from "@/components/coach/mic-button";
import { useSpeechSynthesis } from "@/lib/use-voice";

type Message = {
  id: string;
  role: "user" | "coach";
  text: string;
};

function makeSeed(): Message[] {
  return [{ id: "seed", role: "coach", text: pickCoachWelcome() }];
}

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
    makeSeed(),
  );
  const [localStyle] = useLocalStorage<CoachStyleKey>(
    "thrive:coach:style",
    DEFAULT_STYLE,
  );
  const [cloudMessages, setCloudMessages] = useState<Message[] | null>(null);
  const [cloudStyle, setCloudStyle] = useState<CoachStyleKey | null>(null);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [offline, setOffline] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [contextBlock, setContextBlock] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tts = useSpeechSynthesis();
  // Only speak coach replies that arrive DURING this session, never history
  // rehydrated from cloud on mount.
  const spokenMessageIdsRef = useRef<Set<string>>(new Set());

  const isAuthed = !!user;
  const messages: Message[] = isAuthed ? (cloudMessages ?? []) : localMessages;
  const activeStyleKey: CoachStyleKey = isAuthed
    ? (cloudStyle ?? DEFAULT_STYLE)
    : localStyle;
  const activeStyle = resolveStyle(activeStyleKey);

  // Hydrate history + style from cloud on sign-in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCloudMessages(null);
      setContextBlock(null);
      setCloudStyle(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const [rows, ctx, style] = await Promise.all([
        fetchCoachHistory(user.id),
        fetchCoachContext(user.id),
        fetchCoachStyle(user.id),
      ]);
      if (cancelled) return;
      setContextBlock(renderCoachContext(ctx));
      setCloudStyle((style as CoachStyleKey | null) ?? DEFAULT_STYLE);
      const hist = rows.map((r) => ({
        id: r.id,
        role: r.role === "coach" ? ("coach" as const) : ("user" as const),
        text: r.content,
      }));
      // If empty history (first sign-in), seed with a fresh welcome + save it
      if (hist.length === 0) {
        const fresh = makeSeed();
        setCloudMessages(fresh);
        void saveCoachMessage(user.id, "coach", fresh[0].text);
      } else {
        setCloudMessages(hist);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Refresh context each time the user opens the input (before sending).
  // Snapshot is a moving target — mood/blocks/priorities change through the day.
  const refreshContext = async () => {
    if (!user) return;
    try {
      const ctx = await fetchCoachContext(user.id);
      setContextBlock(renderCoachContext(ctx));
    } catch {
      /* keep last-known context */
    }
  };

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
      // Refresh context in the background — snapshot is dynamic through the day
      void refreshContext();
    }

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, text }) => ({ role, text })),
          context: contextBlock,
          style: activeStyleKey,
        }),
      });
      const data = (await res.json()) as { reply: string; source?: string };
      setOffline(data.source === "offline");
      const coachMsg: Message = {
        id: crypto.randomUUID(),
        role: "coach",
        text: data.reply,
      };
      setMessages((m) => [...m, coachMsg]);
      // Speak the fresh reply if TTS is enabled — but only real Claude replies,
      // not the offline error line (that would be jarring)
      if (data.source !== "offline") {
        spokenMessageIdsRef.current.add(coachMsg.id);
        tts.speak(data.reply);
      }
      // Only persist real Claude replies — don't clutter history with error messages
      if (user && data.source !== "offline") {
        void saveCoachMessage(user.id, "coach", data.reply);
      }
    } catch {
      setOffline(true);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "coach",
          text: "I can't reach my brain right now — the connection dropped. Try once more?",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const doClear = async () => {
    const fresh = makeSeed();
    if (isAuthed && user) {
      await clearCoachHistory(user.id);
      setCloudMessages(fresh);
      await saveCoachMessage(user.id, "coach", fresh[0].text);
    } else {
      setLocalMessages(fresh);
    }
    setConfirmClear(false);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-14rem)] w-full max-w-3xl flex-col sm:h-[calc(100vh-8rem)]">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl shadow-glow bg-gradient-to-br",
              activeStyle.gradient,
            )}
          >
            <span className="text-xl leading-none" aria-hidden>
              {activeStyle.emoji}
            </span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Coach</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {activeStyle.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] tracking-wide text-fg-subtle">
              {isAuthed ? (
                <>
                  <Cloud className="h-2.5 w-2.5 text-teal-300" />
                  <span className="text-teal-300">Synced</span>
                  <span>· lives on your account</span>
                </>
              ) : (
                <>
                  <HardDrive className="h-2.5 w-2.5" />
                  <span>Local · this device only</span>
                </>
              )}
              {offline && (
                <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-amber-300">
                  <WifiOff className="h-2.5 w-2.5" />
                  Offline
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {tts.supported && (
            <button
              onClick={() => {
                if (!tts.muted) tts.cancel();
                tts.setMuted(!tts.muted);
              }}
              aria-pressed={!tts.muted}
              className={cn(
                "glass rounded-full p-2 transition-colors",
                tts.muted
                  ? "text-fg-subtle hover:text-fg"
                  : "text-teal-300 hover:text-teal-200",
              )}
              aria-label={tts.muted ? "Read replies aloud" : "Stop reading replies"}
              title={tts.muted ? "Read replies aloud" : "Stop reading replies"}
            >
              {tts.muted ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          <Link
            href="/settings#coach"
            className="glass inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] text-fg-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
            title="Change coach voice"
          >
            Voice
            <ChevronRight className="h-3 w-3" />
          </Link>
          {messages.length > 1 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="glass rounded-full p-2 text-fg-subtle transition-colors hover:text-fg"
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
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
        <MicButton
          onTranscript={(text, isFinal) => {
            // Live interim transcripts update the draft as the user speaks;
            // the final one lands there too and the user hits send when ready.
            setDraft(text);
            void isFinal; // reserved — could auto-send on final later
          }}
        />
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
