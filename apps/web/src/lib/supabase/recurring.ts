"use client";

import { getBrowserClient } from "./client";
import { todayISO } from "@/lib/streaks";
import { normalizeTime } from "@/lib/plan-time";

export type RecurringBlockRow = {
  id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;
  duration_minutes: number | null;
  title: string;
  active: boolean;
};

const RECURRING_SELECT = "id, day_of_week, start_time, duration_minutes, title, active";

export async function fetchAllRecurring(
  userId: string,
): Promise<RecurringBlockRow[]> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("recurring_blocks")
    .select(RECURRING_SELECT)
    .eq("user_id", userId)
    .eq("active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (error || !data) return [];
  return (data as RecurringBlockRow[]).map((r) => ({
    ...r,
    start_time: normalizeTime(r.start_time),
  }));
}

export async function createRecurring(
  userId: string,
  block: {
    day_of_week: number;
    start_time: string;
    title: string;
    duration_minutes?: number | null;
  },
) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("recurring_blocks")
    .insert({
      user_id: userId,
      day_of_week: block.day_of_week,
      start_time: normalizeTime(block.start_time),
      duration_minutes: block.duration_minutes ?? null,
      title: block.title,
    })
    .select(RECURRING_SELECT)
    .single();
  return { row: (data as RecurringBlockRow | null) ?? null, error };
}

export async function deleteRecurring(id: string) {
  const supabase = getBrowserClient();
  return supabase.from("recurring_blocks").delete().eq("id", id);
}

/**
 * If today has not yet been materialized AND the user has recurring blocks
 * for today's day_of_week AND today has no plan_blocks yet — insert them and
 * mark the day as materialized. Duration flows through.
 *
 * Idempotent: safe to call on every page load.
 */
export async function materializeToday(userId: string): Promise<boolean> {
  const supabase = getBrowserClient();
  const forDate = todayISO();

  const { data: existing } = await supabase
    .from("materialized_days")
    .select("for_date")
    .eq("user_id", userId)
    .eq("for_date", forDate)
    .maybeSingle();
  if (existing) return false;

  const { data: existingBlocks } = await supabase
    .from("plan_blocks")
    .select("id")
    .eq("user_id", userId)
    .eq("for_date", forDate)
    .limit(1);
  if (existingBlocks && existingBlocks.length > 0) {
    await supabase.from("materialized_days").insert({ user_id: userId, for_date: forDate });
    return false;
  }

  const dow = new Date().getDay();
  const { data: recurring } = await supabase
    .from("recurring_blocks")
    .select("start_time, duration_minutes, title")
    .eq("user_id", userId)
    .eq("day_of_week", dow)
    .eq("active", true)
    .order("start_time", { ascending: true });

  if (recurring && recurring.length > 0) {
    const rows = recurring.map((r, i) => ({
      user_id: userId,
      for_date: forDate,
      start_time: normalizeTime(r.start_time as string),
      duration_minutes: (r.duration_minutes as number | null) ?? null,
      title: r.title as string,
      position: i,
    }));
    const { error: insertError } = await supabase.from("plan_blocks").insert(rows);
    if (insertError) return false;
  }

  await supabase.from("materialized_days").insert({ user_id: userId, for_date: forDate });
  return true;
}
