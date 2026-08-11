"use client";

/**
 * Mic button for the coach input. Toggles a SpeechRecognition session and
 * streams live transcript back to the parent via onTranscript. Hides itself
 * on browsers without SpeechRecognition (Firefox, older Safari, etc.).
 */

import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/lib/use-voice";

type Props = {
  onTranscript: (text: string, isFinal: boolean) => void;
  className?: string;
};

export function MicButton({ onTranscript, className }: Props) {
  const { supported, listening, start, stop } = useSpeechRecognition({
    onTranscript,
  });

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      aria-pressed={listening}
      aria-label={listening ? "Stop recording" : "Speak instead of typing"}
      title={listening ? "Tap to stop" : "Speak"}
      className={cn(
        "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-all active:scale-95",
        listening
          ? "bg-rose-500/90 text-white shadow-glow"
          : "glass text-fg-muted hover:bg-white/[0.08] hover:text-fg",
        className,
      )}
    >
      {listening && (
        <span
          className="absolute inset-0 rounded-full bg-rose-400/40 animate-pulse-glow"
          aria-hidden="true"
        />
      )}
      {listening ? (
        <MicOff className="relative h-5 w-5" strokeWidth={2} />
      ) : (
        <Mic className="relative h-5 w-5" strokeWidth={2} />
      )}
    </button>
  );
}
