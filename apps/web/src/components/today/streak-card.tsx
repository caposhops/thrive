"use client";

import { Flame, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardEyebrow } from "@/components/ui/card";
import { computeAppStreak, isoDay } from "@/lib/streaks";
import { useUser } from "@/lib/supabase/use-user";
import { fetchMoodDates } from "@/lib/supabase/moods";

function readLocalCheckInDates(): string[] {
  if (typeof window === "undefined") return [];
  const dates: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith("thrive:mood:")) {
      const date = key.slice("thrive:mood:".length);
      try {
        const value = JSON.parse(window.localStorage.getItem(key) ?? "null");
        if (value !== null) dates.push(date);
      } catch {
        /* ignore */
      }
    }
  }
  return dates;
}

export function StreakCard() {
  const { user } = useUser();
  const [days, setDays] = useState(0);
  const [dates, setDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      let checkIns: string[] = [];
      if (user) {
        // Merge cloud + local so newly-added local entries (before round trip) still count
        try {
          const cloud = await fetchMoodDates(user.id, 60);
          checkIns = Array.from(new Set([...cloud, ...readLocalCheckInDates()]));
        } catch {
          checkIns = readLocalCheckInDates();
        }
      } else {
        checkIns = readLocalCheckInDates();
      }
      if (cancelled) return;
      setDates(new Set(checkIns));
      setDays(computeAppStreak(checkIns));
    };

    refresh();
    const id = window.setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [user]);

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
