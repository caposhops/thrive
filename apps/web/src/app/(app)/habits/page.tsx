"use client";

import { useEffect, useState } from "react";
import {
  Flame,
  Plus,
  Check,
  AlertCircle,
  Cloud,
  HardDrive,
  Loader2,
} from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { Card, CardEyebrow, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { computeStreak, isStreakAtRisk, longestStreak } from "@/lib/streaks";
import { useUser } from "@/lib/supabase/use-user";
import {
  fetchHabitsWithHistory,
  createHabit,
  logHabitDoneToday,
  unlogHabitToday,
  type HabitWithLogs,
} from "@/lib/supabase/habits";
import { CompletionFlash, useCompletionFlash } from "@/components/completion-flash";

type LocalHabit = {
  id: string;
  name: string;
  icon: string;
  goalPerWeek: number;
  doneToday: boolean;
  history: boolean[];
  type: "build" | "break";
};

const seed: LocalHabit[] = [
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

// Default habits to seed for new authenticated users so their first visit
// isn't empty. They can edit / delete from here.
const defaultCloudHabits = [
  { name: "Morning stillness", icon: "🌅", type: "build" as const, goal_per_week: 7 },
  { name: "Move the body", icon: "🌿", type: "build" as const, goal_per_week: 5 },
  { name: "Phone-free first hour", icon: "📵", type: "break" as const, goal_per_week: 7 },
];

type DisplayHabit = {
  id: string;
  name: string;
  icon: string;
  goalPerWeek: number;
  doneToday: boolean;
  history: boolean[];
  type: "build" | "break";
};

function fromCloud(h: HabitWithLogs): DisplayHabit {
  return {
    id: h.id,
    name: h.name,
    icon: h.icon ?? "•",
    goalPerWeek: h.goal_per_week,
    doneToday: h.doneToday,
    history: h.history,
    type: h.type,
  };
}

export default function HabitsPage() {
  const { user, loading: authLoading } = useUser();
  const [localHabits, setLocalHabits] = useLocalStorage<LocalHabit[]>(
    "thrive:habits:v2",
    seed,
  );
  const [cloudHabits, setCloudHabits] = useState<HabitWithLogs[] | null>(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", icon: "🌱", goal: 7 });

  const isAuthed = !!user;

  // Hydrate from cloud + auto-seed on first signed-in visit with no data
  useEffect(() => {
    if (!user) {
      setCloudHabits(null);
      return;
    }
    let cancelled = false;
    setCloudLoading(true);
    (async () => {
      const habits = await fetchHabitsWithHistory(user.id);
      if (cancelled) return;
      if (habits.length === 0) {
        // First-time signed-in user: seed with defaults
        await Promise.all(
          defaultCloudHabits.map((h) => createHabit(user.id, h)),
        );
        const refreshed = await fetchHabitsWithHistory(user.id);
        if (!cancelled) setCloudHabits(refreshed);
      } else {
        setCloudHabits(habits);
      }
      if (!cancelled) setCloudLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const habits: DisplayHabit[] = isAuthed
    ? (cloudHabits ?? []).map(fromCloud)
    : localHabits;

  const { flash, trigger } = useCompletionFlash();

  const toggle = async (id: string) => {
    const wasDone = habits.find((h) => h.id === id)?.doneToday ?? false;
    if (isAuthed && user) {
      // Optimistic update of cloud state
      setCloudHabits((prev) =>
        prev
          ? prev.map((h) => (h.id === id ? { ...h, doneToday: !h.doneToday } : h))
          : prev,
      );
      const current = cloudHabits?.find((h) => h.id === id);
      if (!current) return;
      const op = current.doneToday
        ? unlogHabitToday(user.id, id)
        : logHabitDoneToday(user.id, id);
      const { error } = await op;
      if (error) {
        // Roll back on error
        setCloudHabits((prev) =>
          prev
            ? prev.map((h) =>
                h.id === id ? { ...h, doneToday: current.doneToday } : h,
              )
            : prev,
        );
      }
    } else {
      setLocalHabits((h) =>
        h.map((x) => (x.id === id ? { ...x, doneToday: !x.doneToday } : x)),
      );
    }
    if (!wasDone) trigger("habit-done");
  };

  const addNewHabit = async () => {
    const name = draft.name.trim();
    if (!name) return;
    if (isAuthed && user) {
      await createHabit(user.id, {
        name,
        icon: draft.icon,
        type: "build",
        goal_per_week: draft.goal,
      });
      const refreshed = await fetchHabitsWithHistory(user.id);
      setCloudHabits(refreshed);
    } else {
      setLocalHabits((h) => [
        ...h,
        {
          id: crypto.randomUUID(),
          name,
          icon: draft.icon,
          goalPerWeek: draft.goal,
          doneToday: false,
          history: Array.from({ length: 28 }, () => false),
          type: "build",
        },
      ]);
    }
    setDraft({ name: "", icon: "🌱", goal: 7 });
    setAdding(false);
  };

  const totalXp = habits.reduce(
    (a, h) => a + computeStreak(h.history, h.doneToday) * 10,
    0,
  );
  const level = Math.floor(totalXp / 200) + 1;
  const xpInLevel = totalXp % 200;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <CompletionFlash flash={flash} />
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Habits</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Small. Repeated.
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] tracking-wide text-fg-subtle">
            {authLoading ? null : isAuthed ? (
              <>
                <Cloud className="h-3 w-3 text-teal-300" />
                <span className="text-teal-300">Synced</span>
                <span>· across all your devices</span>
              </>
            ) : (
              <>
                <HardDrive className="h-3 w-3" />
                <span>Local · saved on this device only</span>
              </>
            )}
          </p>
        </div>
        <Button onClick={() => setAdding((a) => !a)}>
          <Plus className="h-4 w-4" />
          New habit
        </Button>
      </header>

      {/* Inline create form */}
      {adding && (
        <Card className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              autoFocus
              type="text"
              maxLength={2}
              value={draft.icon}
              onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
              className="h-14 w-14 shrink-0 rounded-2xl bg-white/[0.04] text-center text-2xl text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15"
              aria-label="Emoji"
            />
            <input
              type="text"
              placeholder="Habit name (e.g. Read 10 pages)"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="h-14 flex-1 rounded-2xl bg-white/[0.04] px-5 text-[15px] text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15"
            />
            <select
              value={draft.goal}
              onChange={(e) =>
                setDraft((d) => ({ ...d, goal: Number(e.target.value) }))
              }
              className="h-14 rounded-2xl bg-white/[0.04] px-4 text-sm text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}× / week
                </option>
              ))}
            </select>
            <Button onClick={addNewHabit} disabled={!draft.name.trim()}>
              Create
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Level / XP */}
      <Card className="mb-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <CardEyebrow>Level {level}</CardEyebrow>
            <CardTitle className="mt-1">Apprentice of self</CardTitle>
            <p className="mt-1 text-sm text-fg-muted">
              {totalXp} XP total · {200 - xpInLevel} to next level
            </p>
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

      {cloudLoading && isAuthed && habits.length === 0 ? (
        <Card className="flex items-center justify-center gap-2 py-12 text-fg-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your habits…
        </Card>
      ) : habits.length === 0 ? (
        <Card className="py-12 text-center">
          <CardEyebrow>Empty page, fresh start</CardEyebrow>
          <CardTitle className="mt-2">No habits yet.</CardTitle>
          <p className="mt-2 text-fg-muted">
            Add one above. Pick something small enough to win at on a hard day.
          </p>
        </Card>
      ) : (
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
                      <h3 className="font-display text-lg font-semibold text-fg">
                        {habit.name}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
                        {habit.type === "build" ? "Building" : "Replacing"} ·{" "}
                        {habit.goalPerWeek}× / week
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
                    aria-pressed={habit.doneToday}
                  >
                    {habit.doneToday && (
                      <Check className="h-5 w-5 text-black" strokeWidth={3} />
                    )}
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
      )}
    </div>
  );
}
