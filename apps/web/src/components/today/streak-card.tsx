"use client";

import { Flame, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardEyebrow } from "@/components/ui/card";
import { computeAppStreak, isoDay } from "@/lib/streaks";

/**
 * Reads mood check-in keys from localStorage to derive the "days thriving" streak.
 * Mood keys are written by MoodCheckin as `thrive:mood:YYYY-MM-DD` for every day
 * the user checked in.
 */
function readCheckInDates(): string[] {
  if (typeof window === "undefined") return [];
  const dates: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith("thrive:mood:")) {
      const date = key.slice("thrive:mood:".length);
      // Mood check-ins are stored as `null` until selected; ignore null values
      try {
        const value = JSON.parse(window.localStorage.getItem(key) ?? "null");
        if (value !== null) dates.push(date);
      } catch {
        /* ignore malformed entries */
      }
    }
  }
  return dates;
}

export function StreakCard() {
  const [days, setDays] = useState(0);
  const [dates, setDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const refresh = () => {
      const checkIns = readCheckInDates();
      setDates(new Set(checkIns));
      setDays(computeAppStreak(checkIns));
    };
    refresh();
    const id = window.setInterval(refresh, 3000); // catch updates from sibling components
    return () => window.clearInterval(id);
  }, []);

  // Render last 14 days as cells, lit if checked in
  const today = new Date();
  const cells = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return { on: dates.has(isoDay(d)), idx: i };
  });

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
      <CardEyebrow>Current streak</CardEyebrow>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-display text-5xl font-semibold tracking-tight text-fg">
          {days}
        </span>
        <span className="mb-1.5 text-sm text-fg-muted">
          {days === 1 ? "day thriving" : "days thriving"}
        </span>
        {days > 0 ? (
          <Flame
            className="ml-auto h-6 w-6 text-amber-400 animate-pulse-glow"
            fill="currentColor"
          />
        ) : (
          <Sparkles className="ml-auto h-6 w-6 text-violet-300" />
        )}
      </div>
      <div className="mt-6 flex items-center gap-1.5">
        {cells.map(({ on, idx }) => (
          <span
            key={idx}
            className={
              on
                ? "h-7 w-3.5 rounded-full bg-gradient-brand"
                : "h-7 w-3.5 rounded-full bg-white/[0.06]"
            }
            style={on ? { opacity: 0.35 + (idx / cells.length) * 0.65 } : undefined}
          />
        ))}
      </div>
      <p className="mt-5 text-xs text-fg-subtle">
        {days === 0
          ? "Check in today to start your first day."
          : days < 3
            ? "Beginning is the hardest part. Keep showing up."
            : days < 7
              ? "The rhythm is taking shape."
              : days < 14
                ? "A real streak. The dopamine compounds."
                : "Two weeks of showing up. This is the version of you that lasts."}
      </p>
    </Card>
  );
}
