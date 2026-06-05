"use client";

import { getBrowserClient } from "./client";
import { isoDay } from "@/lib/streaks";

export type HabitRow = {
  id: string;
  name: string;
  icon: string | null;
  type: "build" | "break";
  goal_per_week: number;
  active: boolean;
  created_at: string;
};

export type HabitWithLogs = HabitRow & {
  doneToday: boolean;
  history: boolean[]; // last 28 days, history[length-1] = yesterday
  logDates: Set<string>; // all dates this habit was done in the window
};

const HISTORY_DAYS = 28;

/**
 * Fetch all active habits for the user, plus their completion history
 * for the last 28 days (rebuilt from habit_logs).
 */
export async function fetchHabitsWithHistory(userId: string): Promise<HabitWithLogs[]> {
  const supabase = getBrowserClient();

  const [{ data: habits, error: habitsError }, { data: logs, error: logsError }] =
    await Promise.all([
      supabase
        .from("habits")
        .select("id, name, icon, type, goal_per_week, active, created_at")
        .eq("user_id", userId)
        .eq("active", true)
        .order("created_at", { ascending: true }),
      (async () => {
        const since = new Date();
        since.setDate(since.getDate() - HISTORY_DAYS);
        return supabase
          .from("habit_logs")
          .select("habit_id, done_on")
          .eq("user_id", userId)
          .gte("done_on", isoDay(since));
      })(),
    ]);

  if (habitsError || !habits) return [];
  if (logsError) return habits.map((h) => toShape(h));

  const logsByHabit = new Map<string, Set<string>>();
  for (const row of logs ?? []) {
    const k = row.habit_id as string;
    if (!logsByHabit.has(k)) logsByHabit.set(k, new Set());
    logsByHabit.get(k)!.add(row.done_on as string);
  }

  return habits.map((h) => toShape(h, logsByHabit.get(h.id) ?? new Set()));
}

function toShape(h: HabitRow, dates: Set<string> = new Set()): HabitWithLogs {
  const today = new Date();
  const todayKey = isoDay(today);
  const doneToday = dates.has(todayKey);

  const history: boolean[] = [];
  for (let i = HISTORY_DAYS; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    history.push(dates.has(isoDay(d)));
  }

  return { ...h, doneToday, history, logDates: dates };
}

export async function createHabit(
  userId: string,
  habit: { name: string; icon?: string; type?: "build" | "break"; goal_per_week?: number },
) {
  const supabase = getBrowserClient();
  return supabase.from("habits").insert({
    user_id: userId,
    name: habit.name,
    icon: habit.icon ?? null,
    type: habit.type ?? "build",
    goal_per_week: habit.goal_per_week ?? 7,
  });
}

export async function logHabitDoneToday(userId: string, habitId: string) {
  const supabase = getBrowserClient();
  return supabase.from("habit_logs").insert({
    user_id: userId,
    habit_id: habitId,
    done_on: isoDay(new Date()),
  });
}

export async function unlogHabitToday(userId: string, habitId: string) {
  const supabase = getBrowserClient();
  return supabase
    .from("habit_logs")
    .delete()
    .eq("user_id", userId)
    .eq("habit_id", habitId)
    .eq("done_on", isoDay(new Date()));
}
