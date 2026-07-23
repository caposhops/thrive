"use client";

import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, X, Clock } from "lucide-react";
import { Card, CardEyebrow } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/lib/use-focus-timer";
import { useUser } from "@/lib/supabase/use-user";
import { fetchTodayFocusSeconds } from "@/lib/supabase/focus";

const PRESETS = [
  { label: "10 min", seconds: 10 * 60 },
  { label: "25 min", seconds: 25 * 60 },
  { label: "50 min", seconds: 50 * 60 },
  { label: "90 min", seconds: 90 * 60 },
];

function formatMMSS(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function formatHM(seconds: number): string {
  if (seconds < 60) return "0m";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function FocusTimer() {
  const { user } = useUser();
  const { state, start, pause, resume, stop } = useFocusTimer();
  const [selectedSeconds, setSelectedSeconds] = useState<number>(25 * 60);
  const [todaySeconds, setTodaySeconds] = useState<number>(0);

  // Refresh today's total: on mount, when timer completes (state → idle), and
  // whenever the user auth flips
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user) {
        const s = await fetchTodayFocusSeconds(user.id);
        if (!cancelled) setTodaySeconds(s);
      } else {
        setTodaySeconds(0);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Deliberately depends on state.kind so we refresh once a session finishes
  }, [user, state.kind]);

  const active = state.kind !== "idle";
  const progress =
    state.kind !== "idle"
      ? 1 - state.remainingMs / state.targetDurationMs
      : 0;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardEyebrow>Focus session</CardEyebrow>
          {active && state.label && (
            <p className="mt-1 text-xs text-fg-muted line-clamp-1">
              {state.label}
            </p>
          )}
        </div>
        {todaySeconds > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-fg-muted">
            <Clock className="h-2.5 w-2.5" />
            {formatHM(todaySeconds)} today
          </span>
        )}
      </div>

      {/* Countdown display */}
      <div className="mt-4 flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#focusRing)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
              className="transition-[stroke-dashoffset] duration-500"
            />
            <defs>
              <linearGradient id="focusRing" x1="0" y1="0" x2="100" y2="100">
                <stop offset="0" stopColor="#a78bfa" />
                <stop offset="0.5" stopColor="#f472b6" />
                <stop offset="1" stopColor="#5eead4" />
              </linearGradient>
            </defs>
          </svg>
          <span
            className={cn(
              "font-display text-xl font-semibold tabular-nums tracking-tight",
              active ? "text-fg" : "text-fg-muted",
            )}
          >
            {active
              ? formatMMSS(state.remainingMs)
              : formatMMSS(selectedSeconds * 1000)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {active ? (
            <p className="text-sm text-fg-muted">
              {state.kind === "paused" ? "Paused" : "In focus"}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setSelectedSeconds(p.seconds)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      selectedSeconds === p.seconds
                        ? "bg-gradient-brand text-black shadow-glow"
                        : "bg-white/[0.05] text-fg-muted hover:bg-white/[0.1] hover:text-fg",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-fg-subtle">
                Pomodoro. Soft chime at end.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center gap-2">
        {state.kind === "idle" ? (
          <button
            onClick={() => start({ durationMs: selectedSeconds * 1000 })}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-brand py-2.5 text-sm font-medium text-black shadow-glow transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            Begin focus
          </button>
        ) : state.kind === "running" ? (
          <>
            <button
              onClick={pause}
              className="glass inline-flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-fg transition-all hover:bg-white/[0.08]"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
            <button
              onClick={stop}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-fg-muted transition-all hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
              aria-label="Stop session early"
              title="Stop early"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={resume}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-brand py-2.5 text-sm font-medium text-black shadow-glow transition-all hover:brightness-110"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              Resume
            </button>
            <button
              onClick={stop}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-fg-muted transition-all hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
              aria-label="End session"
              title="End"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
