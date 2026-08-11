"use client";

/**
 * Full-width phase indicator that replaces the input row in conversation
 * mode. Shows one of four states — idle / listening / thinking / speaking —
 * each with its own animation and micro-copy.
 *
 * Tap it during "speaking" to interrupt the coach and jump back to
 * listening (the manual barge-in). Tap during other phases is a no-op
 * so we don't accidentally interrupt the user's own speech.
 */

import { PhoneOff, Mic, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConversationPhase =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";

type Props = {
  phase: ConversationPhase;
  liveTranscript?: string;
  onExit: () => void;
  onInterrupt: () => void;
};

export function ConversationIndicator({
  phase,
  liveTranscript,
  onExit,
  onInterrupt,
}: Props) {
  const config = {
    idle: {
      label: "Ready.",
      hint: "Tap the phone button in the header to end.",
      Icon: MessageCircle,
      tone: "from-white/10 to-white/5",
      ring: "ring-white/10",
    },
    listening: {
      label: "Listening…",
      hint: "Say what's on your mind. I'll reply when you pause.",
      Icon: Mic,
      tone: "from-teal-400/40 to-emerald-400/25",
      ring: "ring-teal-300/30",
    },
    thinking: {
      label: "Thinking…",
      hint: "A breath. I'm working on it.",
      Icon: Loader2,
      tone: "from-violet-500/40 to-fuchsia-500/25",
      ring: "ring-violet-300/30",
    },
    speaking: {
      label: "Coach is speaking",
      hint: "Tap to interrupt and take your turn.",
      Icon: MessageCircle,
      tone: "from-rose-400/40 to-orange-400/25",
      ring: "ring-rose-300/30",
    },
  }[phase];

  const clickable = phase === "speaking";

  return (
    <div className="mt-4 flex items-center gap-2">
      <button
        type="button"
        onClick={clickable ? onInterrupt : undefined}
        disabled={!clickable}
        className={cn(
          "glass relative flex flex-1 items-center gap-4 rounded-3xl bg-gradient-to-r px-5 py-4 text-left ring-1 transition-all",
          config.tone,
          config.ring,
          clickable && "cursor-pointer hover:brightness-110 active:scale-[0.99]",
        )}
        aria-live="polite"
      >
        {/* Animated icon well */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
          {phase === "listening" && (
            <span
              className="absolute inset-0 rounded-full bg-teal-300/30 animate-pulse-glow"
              aria-hidden
            />
          )}
          {phase === "speaking" && (
            <>
              <span
                className="absolute inset-0 rounded-full bg-rose-300/30 animate-pulse-glow"
                aria-hidden
              />
              <span
                className="absolute inset-1 rounded-full bg-rose-300/20 animate-pulse-glow"
                style={{ animationDelay: "0.4s" }}
                aria-hidden
              />
            </>
          )}
          <config.Icon
            className={cn(
              "relative h-5 w-5 text-fg",
              phase === "thinking" && "animate-spin",
            )}
            strokeWidth={2}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-fg">
            {config.label}
          </p>
          {phase === "listening" && liveTranscript ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-fg-muted">
              &ldquo;{liveTranscript}&rdquo;
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-fg-muted">{config.hint}</p>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={onExit}
        className="glass flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-rose-500/20 hover:text-rose-200"
        aria-label="End conversation"
        title="End conversation"
      >
        <PhoneOff className="h-5 w-5" strokeWidth={2} />
      </button>
    </div>
  );
}
