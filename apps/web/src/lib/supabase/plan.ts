"use client";

import { getBrowserClient } from "./client";
import { todayISO } from "@/lib/streaks";

export type PlanBlockRow = {
  id: string;
  for_date: string;
  start_time: string; // "HH:MM:SS" from Postgres time type
  title: string;
  notes: string | null;
  done: boolean;
  position: number;
  created_at: string;
};

export type DayReflectionRow = {
  id: string;
  for_date: string;
  reflection: string | null;
  mood_after: number | null;
  updated_at: string;
};

export async function fetchTodaysPlan(userId: string): Promise<PlanBlockRow[]> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("plan_blocks")
    .select("id, for_date, start_time, title, notes, done, position, created_at")
    .eq("user_id", userId)
    .eq("for_date", todayISO())
    .order("start_time", { ascending: true });
  if (error || !data) return [];
  return data as PlanBlockRow[];
}

export async function createBlock(
  userId: string,
  block: { start_time: string; title: string; notes?: string; position?: number },
) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("plan_blocks")
    .insert({
      user_id: userId,
      for_date: todayISO(),
      start_time: block.start_time,
      title: block.title,
      notes: block.notes ?? null,
      position: block.position ?? 0,
    })
    .select("id, for_date, start_time, title, notes, done, position, created_at")
    .single();
  return { row: data as PlanBlockRow | null, error };
}

export async function updateBlock(
  id: string,
  patch: Partial<Pick<PlanBlockRow, "start_time" | "title" | "notes" | "done" | "position">>,
) {
  const supabase = getBrowserClient();
  return supabase.from("plan_blocks").update(patch).eq("id", id);
}

export async function deleteBlock(id: string) {
  const supabase = getBrowserClient();
  return supabase.from("plan_blocks").delete().eq("id", id);
}

export async function fetchTodayReflection(
  userId: string,
): Promise<DayReflectionRow | null> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("day_reflections")
    .select("id, for_date, reflection, mood_after, updated_at")
    .eq("user_id", userId)
    .eq("for_date", todayISO())
    .maybeSingle();
  if (error) return null;
  return (data as DayReflectionRow | null) ?? null;
}

export async function upsertReflection(
  userId: string,
  fields: { reflection?: string; mood_after?: number },
) {
  const supabase = getBrowserClient();
  return supabase.from("day_reflections").upsert(
    {
      user_id: userId,
      for_date: todayISO(),
      reflection: fields.reflection ?? null,
      mood_after: fields.mood_after ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,for_date" },
  );
}
