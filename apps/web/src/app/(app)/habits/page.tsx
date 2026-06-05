"use client";

import { Flame, Plus, Check, AlertCircle } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { Card, CardEyebrow, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { computeStreak, isStreakAtRisk, longestStreak } from "@/lib/streaks";

type Habit = {
  id: string;
  name: string;
  icon: string;
  goalPerWeek: number;
  doneToday: boolean;
  history: boolean[]; // last 28 days, history[length-1] = yesterday
  type: "build" | "break";
};

const seed: Habit[] = [
  {
    id: "1",
    name: "Morning stillness",
    icon: "🌅",
    goalPerWeek: 7,
    doneToday: true,
    history: Array.from({ length: 28 }, (_, i) => i >= 4),
    type: "build",
  },
  {
    id: "2",
    name: "Move the body",
    icon: "🌿",
    goalPerWeek: 5,
    doneToday: false,
    history: [
      false, true, true, true, false, true, true,
      true, true, false, true, true, true, true,
      false, true, true, true, true, true, false,
      true, true, true, true, false, true, true,
    ],
    type: "build",
  },
  {
    id: "3",
    name: "Phone-free first hour",
    icon: "📵",
    goalPerWeek: 7,
    doneToday: true,
    history: [
      false, true, true, true, true, true, true,
      true, true, true, true, true, true, true,
      true, false, true, true, true, true, true,
      true, true, true, true, true, true, true,
    ],
    type: "break",
  },
  {
    id: "4",
    name: "Cold shower finish",
    icon: "❄️",
    goalPerWeek: 4,
    doneToday: false,
    history: [
      true, false, true, false, false, true, true,
      false, true, true, false, false, true, false,
      true, false, true, true, false, true, true,
      false, true, true, false, true, true, false,
    ],
    type: "build",
  },
];

export default function HabitsPage() {
  const [habits, setHabits] = useLocalStorage<Habit[]>("thrive:habits:v2", seed);

  const toggle = (id: string) =>
    setHabits((h) =>
      h.map((x) => (x.id === id ? { ...x, doneToday: !x.doneToday } : x)),
    );

  const totalXp = habits.reduce(
    (a, h) => a + computeStreak(h.history, h.doneToday) * 10,
    0,
  );
  const level = Math.floor(totalXp / 200) + 1;
  const xpInLevel = totalXp % 200;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Habits</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Small. Repeated.
          </h1>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          New habit
        </Button>
      </header>

      {/* Level / XP */}
      <Card className="mb-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <CardEyebrow>Level {level}</CardEyebrow>
            <CardTitle className="mt-1">Apprentice of self</CardTitle>
            <p className="mt-1 text-sm text-fg-muted">{totalXp} XP total · {200 - xpInLevel} to next level</p>
          </div>
          <div className="w-full sm:w-72">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full bg-gradient-brand"
                style={{ width: `${(xpInLevel / 200) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {habits.map((habit) => {
          const streak = computeStreak(habit.history, habit.doneToday);
          const best = longestStreak(habit.history, habit.doneToday);
          const atRisk = isStreakAtRisk(habit.history, habit.doneToday);
          const xp = streak * 10;

          return (
            <Card key={habit.id} className="group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{habit.icon}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-fg">{habit.name}</h3>
                    <p className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
                      {habit.type === "build" ? "Building" : "Replacing"} · {habit.goalPerWeek}× / week
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggle(habit.id)}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    habit.doneToday
                      ? "border-transparent bg-gradient-brand shadow-glow"
                      : "border-white/15 hover:border-white/30",
                  )}
                  aria-label={habit.doneToday ? "Mark undone" : "Mark done"}
                >
                  {habit.doneToday && <Check className="h-5 w-5 text-black" strokeWidth={3} />}
                </button>
              </div>

              <div className="mt-5 flex items-center gap-1">
                {habit.history.slice(-21).map((on, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-7 flex-1 rounded-md transition-colors",
                      on ? "bg-gradient-brand opacity-80" : "bg-white/[0.05]",
                    )}
                  />
                ))}
                <span
                  className={cn(
                    "h-7 flex-1 rounded-md ring-1 ring-inset",
                    habit.doneToday
                      ? "bg-gradient-brand ring-white/20"
                      : "bg-white/[0.02] ring-white/15",
                  )}
                  title="Today"
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs">
                {atRisk ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-300">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {streak} day streak · at risk today
                  </span>
                ) : streak > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-300">
                    <Flame className="h-3.5 w-3.5" fill="currentColor" />
                    {streak} day streak
                  </span>
                ) : (
                  <span className="text-fg-subtle">Start a new streak today</span>
                )}
                <span className="text-fg-subtle">
                  Best {best} · +{xp} XP
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
