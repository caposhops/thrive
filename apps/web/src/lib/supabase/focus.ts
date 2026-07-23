"use client";

import { getBrowserClient } from "./client";
import { isoDay } from "@/lib/streaks";

export type FocusSessionRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  actual_seconds: number | null;
  label: string | null;
  completed: boolean;
};

export async function logFocusSession(
  userId: string,
  fields: {
    started_at: string;
    ended_at: string;
    duration_seconds: number;
    actual_seconds: number;
    label?: string;
    completed: boolean;
  },
) {
  const supabase = getBrowserClient();
  return supabase.from("focus_sessions").insert({
    user_id: userId,
    started_at: fields.started_at,
    ended_at: fields.ended_at,
    duration_seconds: fields.duration_seconds,
    actual_seconds: fields.actual_seconds,
    label: fields.label ?? null,
    completed: fields.completed,
  });
}

/**
 * Total focused seconds today (only counting sessions marked completed).
 */
export async function fetchTodayFocusSeconds(userId: string): Promise<number> {
  const supabase = getBrowserClient();
  const start = `${isoDay(new Date())}T00:00:00.000Z`;
  const { data, error } = await supabase
    .from("focus_sessions")
    .select("actual_seconds, completed")
    .eq("user_id", userId)
    .gte("started_at", start);
  if (error || !data) return 0;
  return data
    .filter((r) => r.completed)
    .reduce((sum, r) => sum + ((r.actual_seconds as number) || 0), 0);
}
