"use client";

import { getBrowserClient } from "./client";
import { todayISO } from "@/lib/streaks";
import { normalizeTime } from "@/lib/plan-time";

export type RecurringBlockRow = {
  id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;
  title: string;
  active: boolean;
};

export async function fetchAllRecurring(
  userId: string,
): Promise<RecurringBlockRow[]> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("recurring_blocks")
    .select("id, day_of_week, start_time, title, active")
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
  block: { day_of_week: number; start_time: string; title: string },
) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("recurring_blocks")
    .insert({
      user_id: userId,
      day_of_week: block.day_of_week,
      start_time: normalizeTime(block.start_time),
      title: block.title,
    })
    .select("id, day_of_week, start_time, title, active")
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
 * mark the day as materialized.
 *
 * Idempotent: safe to call on every page load. First call may do work, later
 * calls short-circuit.
 */
export async function materializeToday(userId: string): Promise<boolean> {
  const supabase = getBrowserClient();
  const forDate = todayISO();

  // 1. Check the materialized marker — cheap early-out
  const { data: existing } = await supabase
    .from("materialized_days")
    .select("for_date")
    .eq("user_id", userId)
    .eq("for_date", forDate)
    .maybeSingle();
  if (existing) return false;

  // 2. Also short-circuit if today already has any plan_blocks (user built
  //    manually before we materialized) — respect their work, just mark today
  //    as done.
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

  // 3. Look up today's recurring blocks
  const dow = new Date().getDay(); // 0..6
  const { data: recurring } = await supabase
    .from("recurring_blocks")
    .select("start_time, title")
    .eq("user_id", userId)
    .eq("day_of_week", dow)
    .eq("active", true)
    .order("start_time", { ascending: true });

  // 4. If any, insert them into plan_blocks
  if (recurring && recurring.length > 0) {
    const rows = recurring.map((r, i) => ({
      user_id: userId,
      for_date: forDate,
      start_time: normalizeTime(r.start_time as string),
      title: r.title as string,
      position: i,
    }));
    const { error: insertError } = await supabase.from("plan_blocks").insert(rows);
    if (insertError) return false;
  }

  // 5. Mark today as materialized so we don't repeat
  await supabase.from("materialized_days").insert({ user_id: userId, for_date: forDate });
  return true;
}
