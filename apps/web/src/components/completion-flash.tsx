"use client";

/**
 * Toast-style affirmation that appears at the top-center of the viewport
 * (below any top bar) when a completion event fires. Fades after ~1.8s.
 *
 * Renders via portal into document.body so it lives above every card and
 * respects no parent's overflow-hidden.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  pickCompletionAffirmation,
  type CompletionContext,
} from "@/lib/affirmations";
import { playTap, playDayComplete } from "@/lib/completion-sound";

type FlashState = {
  key: number;
  text: string;
  big: boolean; // day-complete gets a slightly bigger, more prominent look
};

const DURATION_MS = 1800;

/**
 * Hook returning { flash, trigger }.
 *
 * - `flash` — current state; pair with <CompletionFlash flash={flash} />
 * - `trigger(context)` — fires a new affirmation + sound
 */
export function useCompletionFlash() {
  const [flash, setFlash] = useState<FlashState | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), DURATION_MS);
    return () => window.clearTimeout(t);
  }, [flash]);

  const trigger = (context: CompletionContext) => {
    const text = pickCompletionAffirmation(context);
    const big = context === "day-complete";
    setFlash({ key: Date.now(), text, big });
    if (big) {
      playDayComplete();
    } else {
      playTap();
    }
  };

  return { flash, trigger };
}

export function CompletionFlash({ flash }: { flash: FlashState | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !flash) return null;

  return createPortal(
    <div
      key={flash.key}
      className={cn(
        "pointer-events-none fixed left-1/2 z-[100] -translate-x-1/2 animate-flash-toast",
        // Position: below the mobile top bar, top on desktop
        "top-16 sm:top-6",
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "rounded-full bg-gradient-brand text-black shadow-glow",
          flash.big
            ? "px-5 py-2 font-display text-sm font-semibold"
            : "px-4 py-1.5 text-[12px] font-medium",
        )}
      >
        {flash.text}
      </div>
    </div>,
    document.body,
  );
}
