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
 * Fetch per-day signals across an inclusive date range.
 * Returns one WeekDay entry per calendar day in [startISO, endISO], oldest first.
 * Used by /week (7-day windows) and the month calendar.
 */
export async function fetchDateRange(
  userId: string,
  startISO: string,
  endISO: string,
): Promise<WeekDay[]> {
  const supabase = getBrowserClient();
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

  // Walk the range one day at a time
  const days: WeekDay[] = [];
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const [ey, em, ed] = endISO.split("-").map(Number);
  const cursor = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  while (cursor <= end) {
    const key = isoDay(cursor);
    const refl = reflectionsByDay.get(key);
    days.push({
      date: key,
      blocks: blocksByDay.get(key) ?? [],
      mood: moodByDay.get(key) ?? null,
      reflection: refl?.text ?? null,
      reflectionMood: refl?.mood ?? null,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/**
 * Fetch per-day signals for a 7-day window centered on today.
 *  - "past" (default): last 7 days including today
 *  - "next": today + next 6 days
 */
export async function fetchWeek(
  userId: string,
  direction: WeekDirection = "past",
): Promise<WeekDay[]> {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);
  if (direction === "past") {
    startDate.setDate(startDate.getDate() - 6);
  } else {
    endDate.setDate(endDate.getDate() + 6);
  }
  return fetchDateRange(userId, isoDay(startDate), isoDay(endDate));
}

/**
 * Return the ISO date range that fills a Monday-first calendar grid for the
 * given month. Includes trailing days from the previous month and leading days
 * from the next month so a 6×7 grid always renders.
 */
export function monthGridRange(
  year: number,
  monthIndex0: number,
): { startISO: string; endISO: string } {
  // JS getDay: 0 = Sunday .. 6 = Saturday. We want Monday-first columns.
  const firstOfMonth = new Date(year, monthIndex0, 1);
  const jsDay = firstOfMonth.getDay(); // 0..6
  const daysBackToMonday = (jsDay + 6) % 7; // 0 if Monday, 6 if Sunday
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - daysBackToMonday);
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 41); // 6 rows × 7 cols - 1
  return { startISO: isoDay(gridStart), endISO: isoDay(gridEnd) };
}
