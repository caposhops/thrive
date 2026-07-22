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

/**
 * Fetch all the per-day signals for a rolling 7-day window ending today.
 * Returns oldest-first so the UI can render left-to-right / top-to-bottom.
 */
export async function fetchWeek(userId: string): Promise<WeekDay[]> {
  const supabase = getBrowserClient();

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sinceISO = isoDay(sevenDaysAgo);
  const sinceStartOfDay = `${sinceISO}T00:00:00.000Z`;

  const [blocksRes, moodsRes, reflectionsRes] = await Promise.all([
    supabase
      .from("plan_blocks")
      .select("id, for_date, start_time, title, done")
      .eq("user_id", userId)
      .gte("for_date", sinceISO)
      .order("start_time", { ascending: true }),
    supabase
      .from("mood_checkins")
      .select("value, created_at")
      .eq("user_id", userId)
      .gte("created_at", sinceStartOfDay)
      .order("created_at", { ascending: false }),
    supabase
      .from("day_reflections")
      .select("for_date, reflection, mood_after")
      .eq("user_id", userId)
      .gte("for_date", sinceISO),
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

  // Assemble the 7-day rolling window, oldest first
  const days: WeekDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
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
