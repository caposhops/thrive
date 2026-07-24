"use client";

import { getBrowserClient } from "./client";
import { isoDay } from "@/lib/streaks";
import { normalizeTime } from "@/lib/plan-time";
import type { MoodValue } from "./moods";

export type WeekDay = {
  date: string; // YYYY-MM-DD
  blocks: Array<{ id: string; start_time: string; title: string; done: boolean }>;
  mood: MoodValue | null;
  reflection: string | null;
  reflectionMood: MoodValue | null;
};

export type WeekDirection = "past" | "next";

/**
 * Fetch per-day signals for a 7-day window.
 *  - "past" (default): last 7 days including today
 *  - "next": today + next 6 days
 * Returns oldest-first so the UI can render left-to-right / top-to-bottom.
 */
export async function fetchWeek(
  userId: string,
  direction: WeekDirection = "past",
): Promise<WeekDay[]> {
  const supabase = getBrowserClient();

  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);
  if (direction === "past") {
    startDate.setDate(startDate.getDate() - 6);
  } else {
    endDate.setDate(endDate.getDate() + 6);
  }
  const startISO = isoDay(startDate);
  const endISO = isoDay(endDate);
  const startOfDayISO = `${startISO}T00:00:00.000Z`;

  const [blocksRes, moodsRes, reflectionsRes] = await Promise.all([
    supabase
      .from("plan_blocks")
      .select("id, for_date, start_time, title, done")
      .eq("user_id", userId)
      .gte("for_date", startISO)
      .lte("for_date", endISO)
      .order("start_time", { ascending: true }),
    supabase
      .from("mood_checkins")
      .select("value, created_at")
      .eq("user_id", userId)
      .gte("created_at", startOfDayISO)
      .order("created_at", { ascending: false }),
    supabase
      .from("day_reflections")
      .select("for_date, reflection, mood_after")
      .eq("user_id", userId)
      .gte("for_date", startISO)
      .lte("for_date", endISO),
  ]);

  const blocksByDay = new Map<string, WeekDay["blocks"]>();
  for (const row of blocksRes.data ?? []) {
    const key = row.for_date as string;
    const arr = blocksByDay.get(key) ?? [];
    arr.push({
      id: row.id as string,
      start_time: normalizeTime(row.start_time as string),
      title: row.title as string,
      done: !!row.done,
    });
    blocksByDay.set(key, arr);
  }

  // Keep the latest mood per day
  const moodByDay = new Map<string, MoodValue>();
  for (const row of moodsRes.data ?? []) {
    const key = isoDay(new Date(row.created_at as string));
    if (!moodByDay.has(key)) {
      moodByDay.set(key, row.value as MoodValue);
    }
  }

  const reflectionsByDay = new Map<
    string,
    { text: string | null; mood: MoodValue | null }
  >();
  for (const row of reflectionsRes.data ?? []) {
    reflectionsByDay.set(row.for_date as string, {
      text: (row.reflection as string | null) ?? null,
      mood: (row.mood_after as MoodValue | null) ?? null,
    });
  }

  // Assemble the 7-day window, oldest first.
  // past  → 6 days ago .. today   (i from 6..0)
  // next  → today .. 6 days ahead (i from 0..6)
  const days: WeekDay[] = [];
  const offsets =
    direction === "past"
      ? [-6, -5, -4, -3, -2, -1, 0]
      : [0, 1, 2, 3, 4, 5, 6];
  for (const offset of offsets) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    const key = isoDay(d);
    const refl = reflectionsByDay.get(key);
    days.push({
      date: key,
      blocks: blocksByDay.get(key) ?? [],
      mood: moodByDay.get(key) ?? null,
      reflection: refl?.text ?? null,
      reflectionMood: refl?.mood ?? null,
    });
  }
  return days;
}
