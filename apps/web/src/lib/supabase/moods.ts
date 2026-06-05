"use client";

import { getBrowserClient } from "./client";
import { isoDay, todayISO } from "@/lib/streaks";

export type MoodValue = 1 | 2 | 3 | 4 | 5;

/**
 * Today's mood for the given user, or null if not checked in today.
 */
export async function fetchTodayMood(userId: string): Promise<MoodValue | null> {
  const supabase = getBrowserClient();
  const start = `${todayISO()}T00:00:00.000Z`;
  const end = `${todayISO()}T23:59:59.999Z`;
  const { data, error } = await supabase
    .from("mood_checkins")
    .select("value")
    .eq("user_id", userId)
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.value as MoodValue;
}

/**
 * Set (or replace) today's mood for the user.
 * Inserts a new row; we tolerate multiple per day and just use the latest.
 */
export async function setTodayMood(userId: string, value: MoodValue) {
  const supabase = getBrowserClient();
  const { error } = await supabase.from("mood_checkins").insert({
    user_id: userId,
    value,
  });
  return { error };
}

/**
 * Distinct ISO dates the user has checked in mood on, in the last `days` days.
 * Used by the StreakCard to compute the "days thriving" streak.
 */
export async function fetchMoodDates(userId: string, days = 60): Promise<string[]> {
  const supabase = getBrowserClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from("mood_checkins")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  const set = new Set<string>();
  for (const row of data) {
    set.add(isoDay(new Date(row.created_at as string)));
  }
  return Array.from(set);
}
