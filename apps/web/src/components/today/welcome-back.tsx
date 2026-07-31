"use client";

/**
 * Warm welcome-back card that appears on /today when the user has been
 * away for at least one full calendar day. Never mentions the exact miss
 * count as a negative — the message is "you're back, that's the whole
 * thing." Tiered copy so a 2-day gap feels different from a 20-day gap.
 *
 * Dismissable — once dismissed, gone for the session.
 */

import { Coffee, Sun, Moon, X } from "lucide-react";
import { useLapse } from "@/lib/use-lapse";

type Tier = {
  Icon: typeof Coffee;
  eyebrow: string;
  title: string;
  body: string;
};

function tierFor(days: number): Tier | null {
  if (days < 2) return null;
  if (days <= 4) {
    return {
      Icon: Coffee,
      eyebrow: "Welcome back",
      title: `It's been a few days.`,
      body: "No streaks lost. No catch-up. What's alive right now?",
    };
  }
  if (days <= 14) {
    return {
      Icon: Sun,
      eyebrow: "Welcome back",
      title: "You're here. That's the whole thing.",
      body: "Nothing to catch up on. Start with one small thing.",
    };
  }
  return {
    Icon: Moon,
    eyebrow: "Welcome back",
    title: "It's good to see you.",
    body: "Whatever pulled you away — you don't owe me an explanation. What would feel good to do right now?",
  };
}

export function WelcomeBack() {
  const { lapseDays, ready, dismissed, dismiss } = useLapse();

  if (!ready || dismissed) return null;
  const tier = tierFor(lapseDays);
  if (!tier) return null;

  const { Icon, eyebrow, title, body } = tier;

  return (
    <div
      className="glass relative mb-5 overflow-hidden rounded-3xl bg-gradient-glow p-5 shadow-soft"
      role="status"
    >
      <div className="absolute -bottom-14 -right-14 h-40 w-40 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-fg">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
            {eyebrow}
          </p>
          <p className="mt-1 font-display text-lg font-semibold leading-tight tracking-tight text-fg">
            {title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">{body}</p>
        </div>
        <button
          onClick={dismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-white/[0.06] hover:text-fg"
          aria-label="Dismiss welcome back"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
